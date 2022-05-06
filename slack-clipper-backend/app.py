#!/usr/bin/env python

from flask import Flask, jsonify, request, abort, Response
from google.cloud import firestore
import os
import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth
from threading import Thread
import json
import time

app = Flask(__name__)

# Initializations...
cred = credentials.Certificate('slack-clipper-credentials.json')
firebase_admin.initialize_app(cred)

SLACK_BOT_USER_OAUTH2 = os.getenv('SLACK_BOT_USER_OAUTH2')


def get_and_clip_messages_from_conversation(headers, channel_id, user_info_dict, requesting_user_id):
    # call slack conversations api to get messages
    # we request the last 500 by default to make sure that we're able to get it all
    conversations_payload = {'token': SLACK_BOT_USER_OAUTH2,
                             'channel': channel_id, 'limit': 500}
    r = requests.get("https://slack.com/api/conversations.history",
                     headers=headers, params=conversations_payload)
    r_json = r.json()
    start_message_index = -2
    end_message_index = -1
    # parse the slack conversations for the emoji denoters and only clip out that series of messages that are denoted by emojis
    messages = r_json["messages"]
    # enumerate from the reversed listed
    for index, message in enumerate(r_json["messages"]):
        if "reactions" in message:
            for reaction in message["reactions"]:
                if reaction["name"] == "book":
                    end_message_index = index
                    # if we reach an open book, then we should just terminate
                elif reaction["name"] == "closed_book":
                    start_message_index = index

        if end_message_index != -1:
            break

    # sanity that check that start_message_index comes before end_message_index
    # if either start_message_index is not set or end_message_index is not set, then just clip the last twenty messages, or the entire conversation if there are less than
    # twenty messages
    if start_message_index == -2 or end_message_index == -1:
        start_message_index = 0
        end_message_index = min(19, len(messages)-1)
        explanation_of_error = "Clipper had trouble parsing your emoji markers, so we defaulted to clipping the last twenty messages. In the future, please remember to use :open_book and :closed_book, respectively, to denote the beginning and ending messages of the snippet you want to clip."

    # if start_message_index is greater than end_message_index
    # then should swap them
    try:
        assert(start_message_index < end_message_index)
    except:
        tmp = start_message_index
        start_message_index = end_message_index
        end_message_index = tmp
        explanation_of_error = "Clipper had trouble parsing your emoji markers, so we defaulted to clipping the last twenty messages. In the future, please remember to use :open_book and :closed_book, respectively, to denote the beginning and ending messages of the snippet you want to clip."

    clipped_messages = messages[start_message_index:end_message_index+1]
    clipped_messages.reverse()
    # set readable user names + emails in the messages
    # concatenate the message body into a giant string
    body = ""
    # Starts constructing the body.
    last_real_name = ''

    # I'm creating a little scheme for how to denote slack snippets.
    # Specifically, we'll break the body into chunks where
    # they're broken down into '''~~~ ~~~''' groups, where the first line
    # of the group (after the triple ~ is the user's real name).
    # So, now I'm going to clip it and then make the frontend handle- and
    # parse this accordingly.
    for m in clipped_messages:
        m["user_real_name"] = user_info_dict[m["user"]]["user_real_name"]
        m["user_email"] = user_info_dict[m["user"]]["user_email"]
        if m['user_real_name'] != last_real_name:
            if last_real_name != '':
                # Demarcations of close.
                body += "~~~'''\n"
            # Demarcations for start-of-chat.
            body += "'''~~~"
            body += m['user_real_name'] + '\n'
            last_real_name = m['user_real_name']
        # Add the next line.
        body += m["text"] + '\n'
    # End body.
    body += "~~~'''"
    return body, clipped_messages


def get_users_info_in_conversation(headers, user_ids):
    user_info_dict = {}
    for user_id in user_ids:
        user_payload = {'token': SLACK_BOT_USER_OAUTH2,
                        'user': user_id}

        u = requests.get("https://slack.com/api/users.info",
                         headers=headers, params=user_payload)
        u_json = u.json()

        user_email = ""
        user_real_name = u_json["user"]["real_name"]
        if "email" in u_json["user"]["profile"]:
            user_email = u_json["user"]["profile"]["email"]
        user_info_dict[user_id] = {
            "user_real_name": user_real_name, "user_email": user_email}
    return user_info_dict


def link_snippet_to_firebase_account(db, user_email):
    # connect to firebase authentication system
    # if there isn't already an account under this email in firebase auth
    # then create a new "shadow" user in the user table w/ associated user id, email, name
    # will need to reconcile this user table later on
    shadow_user_id = ""
    firebase_auth_user_id = ""
    try:
        user = auth.get_user_by_email(user_email)
        firebase_auth_user_id = user.uid
    except firebase_admin.auth.UserNotFoundError:
        # if error is a UserNotFoundError, then create shadow user in user table
        # use the user_email as a key in the users collection so that we don't end up with tons of duplicate
        # entries
        print("user email doesn't exist in firebase auth store")
    except ValueError:
        print('email was empty or malformed')
    except firebase_admin.exceptions.FirebaseError:
        print('firebase search error')
    return firebase_auth_user_id


def get_members_in_conversation(channel_id, headers):
    # get all members in a conversation
    members_in_conversation_payload = {
        'token': SLACK_BOT_USER_OAUTH2, 'channel': channel_id}
    m = requests.get("https://slack.com/api/conversations.members",
                     headers=headers, params=members_in_conversation_payload)
    m_json = m.json()
    members_in_conversation = m_json["members"]
    return members_in_conversation


def clipper(text, user_id, channel_id, response_url):

    # Store these messages on cloud firestore
    # Use a service account
    db = firestore.Client()
    doc_ref = db.collection(u'snippets').document()
    explanation_of_error = ""
    # call slack user api to get infomration about user
    # to automatically create a user account

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    members_in_conversation = get_members_in_conversation(channel_id, headers)

    user_info_dict = get_users_info_in_conversation(
        headers, members_in_conversation)

    body, clipped_messages = get_and_clip_messages_from_conversation(
        headers, channel_id, user_info_dict, user_id)

    firebase_auth_user_id = link_snippet_to_firebase_account(
        db, user_info_dict[user_id]["user_email"])

    doc_ref.set({
        u'title': text,
        u'user_real_name': user_info_dict[user_id]["user_real_name"],
        u'user_email': user_info_dict[user_id]["user_email"],
        u'firebase_auth_user_id': firebase_auth_user_id,
        u'slack_user_id': user_id,
        u'messages': clipped_messages,
        u'body': body,
        u'timestamp': int(time.time()),  # epoch timestamp in seconds
        u'isPrivate': True,
        u'tags': ['slack'],
    })

    # get back an id from firebase
    # create a link that accesses the clipped conversation with the id attached
    link_to_clip = 'https://slack-clipper.com/{snippet_id}'.format(
        snippet_id=doc_ref.id)

    json_headers = {
        'Content-Type': 'application/json',
    }
    data = {
        "text": "{link} \n {explanation_of_errors}".format(link=link_to_clip, explanation_of_errors=explanation_of_error)
    }
    response = requests.post(
        response_url, headers=json_headers, data=json.dumps(data))


@app.route('/clip', methods=['POST'])
def slash_command():
    """Parse the command parameters, validate them, and respond.
    Note: This URL must support HTTPS and serve a valid SSL certificate.
    """
    # Parse the parameters you need
    token = request.form.get('token', None)  # TODO: validate the token
    user_id = request.form.get('user_id', None)
    text = request.form.get('text', None)
    channel_id = request.form.get('channel_id', None)
    response_url = request.form.get('response_url', None)
    print(response_url)

    # Validate the slack token
    SLACK_SLASH_COMMAND_VERIFICATION_TOKEN = os.getenv(
        'SLACK_SLASH_COMMAND_VERIFICATION_TOKEN')
    if token != SLACK_SLASH_COMMAND_VERIFICATION_TOKEN:
        abort(400)

    # asynchronously handle
    thr = Thread(target=clipper, args=[
                 text, user_id, channel_id, response_url])
    thr.start()

    return "We are clipping, please wait one second for the link!"

if __name__ == '__main__':
    app.run()
