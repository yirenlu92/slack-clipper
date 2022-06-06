import os
import json
from uuid import uuid4
from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
import firebase_admin
from firebase_admin import credentials, firestore, storage

# Slack App
app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

# Firebase bucket
cred = credentials.Certificate('slack-clipper-credentials.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'slack-clipper.appspot.com'
})
db = firestore.client()
bucket = storage.bucket()


def get_conversation_thread(client, channel, ts):
    replies = client.conversations_replies(channel=channel, ts=ts)
    messages = list()
    users = {}
    for message in replies["messages"]:
        user_id = message["user"]
        if user_id not in users:
            user_info = client.users_info(user=user_id)
            # print(user_info["user"])
            users[user_id] = {
                "real_name": user_info["user"]["real_name"],
            }

        messages.append({
            "text": message["text"],
            "name": users[user_id]["real_name"],
        })

        if "files" in message:
            permalinksToAttachments = ""
            for file in message["files"]:
                print(json.dumps(file, indent=4))
                if not file['public_url_shared']:
                    app.client.files_sharedPublicURL(file=file["id"], token=os.environ.get("USER_TOKEN"))
                if file["filetype"]=="png" or file["filetype"]=="jpg" or file["filetype"]=="jpeg": #file is image
                    permalinksToAttachments = f'{permalinksToAttachments}\n<br>![Download]({file["url_private_download"]}?pub_secret={file["permalink_public"].split("-")[-1]})'
                else: #file is not image
                    print(file)
                    permalinksToAttachments = f'{permalinksToAttachments}\n<br>[Download]({file["permalink_public"]})'
            messages.append({
                "text": f"*Attachments:* <br>{permalinksToAttachments}",
                "name": "",
            })

    return messages


def make_markdown_message(name, text):
    returnName = ""
    if name == "":
        returnName = ""
    else:
        returnName = f"## {name}"
    return f"""{returnName}
{text}

"""


def get_markdown_text(conversation_thread):

    markdown_text = ""

    if len(conversation_thread) > 0:
        message = conversation_thread[0]
        markdown_text = make_markdown_message(
            message["name"],
            message["text"],
        )

    markdown_text += """
---
"""

    for message in conversation_thread[1:]:
        markdown_text = f"{markdown_text}{make_markdown_message(message['name'], message['text'])}"

    return markdown_text


def upload_markdown_file_to_firebase(markdown_text, userid, channelid):
    print("Uploading to Firebase...")
    filename = f"{uuid4()}.md"
    with open(filename, "w") as f:
        f.write(markdown_text)

    blob = bucket.blob(filename)
    blob.metadata = {"firebaseStorageDownloadTokens": uuid4()}
    outfile = os.path.abspath(filename)
    blob.upload_from_filename(outfile)

    blob.make_public()
    print(blob.public_url)
    app.client.chat_postEphemeral(
        user=userid,
        channel=channelid,
        text=blob.public_url
        # You could also use a blocks[] array to send richer content
    )

    os.remove(filename)
    print(f"File uploaded successfully: {filename}")


@app.shortcut("clip_markdown")
def clip_markdown(ack, shortcut, client):

    print("clipping markdown")
    ack()

    channel = shortcut["channel"]["id"]
    userid = shortcut["user"]["id"]
    ts = shortcut["message"]["ts"]
    title = shortcut["message"]["text"]

    print(f"[CLIP] channel={channel} ts={ts} thread-title='{title}'")

    conversation_thread = get_conversation_thread(client, channel, ts)
    markdown_text = get_markdown_text(conversation_thread)
    upload_markdown_file_to_firebase(markdown_text, userid, channel)


from flask import Flask, request

flask_app = Flask(__name__)
handler = SlackRequestHandler(app)


@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)


# Start your app
if __name__ == "__main__":
    app.start(port=int(os.environ.get("PORT", 3000)))
    
