import React, { useState, useEffect } from "react";
import queryString from "query-string";

import { makeStyles } from "@material-ui/styles";
import Message from "./Message";
import { firestore } from "../base";
import universal_styles from './UniversalStyles'

import Header from "./Header"
import { chartreuse } from "color-name";


const useStyles = makeStyles({...universal_styles, ...
  {
  "postSection": {
    whiteSpace: 'pre-wrap',
  },
  "postCode": {
    backgroundColor: "#eee",
  },
  "chatSpeaker": {
    fontWeight: '600',
  },
  "chatBody": {
    backgroundColor: '#f0f8f6',
    whiteSpace: 'pre-wrap',
    borderRadius: '5px',
    width: '75%',
  },

}});


function BodyMarkdown(props) {
  const classes = useStyles();
  // Sections is an array of dicts that describe
  // how to format each subpart.
  var [sections, setSections] = useState([]);

  useEffect(()=> {
    // Start breaking up our body into
    // usable text.

    var body_sections = [];

    // The position of the last character that was already
    // processed.
    var last_index_handled  = -1;

    //console.log('before the looper, our body looked like', props.body);

    // For iteration of the loop, we'll assess if we are done population the
    // sections, and break ourselves out of this loop.  This is a for so we
    // don't infinite loop by accident.
    // I am not allowing nesting (code inside chats, chats in chats).
    // That is too advanced.\
    for (var i = 0; i < props.body.length; i++) {
      var next_openchat = props.body.indexOf("'''~~~", last_index_handled+1);
      var next_opencode = props.body.indexOf("```", last_index_handled + 1);
      if (next_openchat === last_index_handled+1) {
        // Then, we are at a chat point.
        // Find when the chat gets closed.
        var next_closechat = props.body.indexOf("~~~'''", next_openchat+6);
        var the_substr = props.body.substring(next_openchat+6, next_closechat);
        var firstbreak = the_substr.indexOf('\n');
        var speaker = the_substr.substring(0, firstbreak);

        // contents starts at firstbreak+1, to get rid of the initial newline.
        var contents   = the_substr.substring(firstbreak+1, the_substr.length);
        body_sections.push({'type': 'chat', 'contents': contents, 'speaker': speaker });
        // +5 because we can get past the closing section, and because +0 includes the character
        // of one of the close-chat demarcations as well. So we are recording the last
        // index that was handled.
        last_index_handled = next_closechat + 5;
      } else if (next_opencode == last_index_handled +1) {
        // Then, we are at a code point.
        var next_closecode = props.body.indexOf("```", next_opencode + 3);
        var the_substr = props.body.substring(next_opencode+3, next_closecode);
        body_sections.push({'type': 'code', 'contents': the_substr});
        last_index_handled = next_closecode + 2;
      } else {
        // Otherwise, we are at a rawtext point.
        // This is the easiest thing in the world.
        var next_possible_endpoint = props.body.length;
        if (next_openchat > -1 && next_openchat < next_possible_endpoint) {
          next_possible_endpoint = next_openchat;
        }
        if (next_opencode > -1 && next_opencode < next_possible_endpoint) {
          next_possible_endpoint = next_opencode;
        }

        var the_substr = props.body.substring(last_index_handled+1, next_possible_endpoint);
        body_sections.push({'type': 'plain', 'contents': the_substr});
        last_index_handled = next_possible_endpoint-1;
      }
      // Check if we handled all we can.
      if (last_index_handled >= props.body.length-1) {
        break;
      }

    }

    //console.log('After this big ole looper, we got ', body_sections);
    setSections(body_sections);

  }, [props])

  // Give people a couple of <pre> sections
  // TODO: attach clipboard sections.
  return (
    <div>
      {
        sections.map((oneSection, index) => {
          // Start figuring out what type each section is.
          if (oneSection.type == 'plain') {
            return (
              <div key={index} className={classes.postSection + ''} >{oneSection.contents}</div>
            )
          } else if (oneSection.type == 'code') {
            return(
              <pre className={classes.postCode + " py-1 px-1"} key={index}>
              {oneSection.contents}
              </pre>
            )
          } else if (oneSection.type == 'chat') {
            // TODO: make this styling with bootstrap/material's classes,
            // instead of bespoke dumb stuff every time.
            return(
              <div key={index}>
                <div className={classes.chatSpeaker}>
                  {oneSection.speaker}
                </div>
              <div className={classes.chatBody + " py-1 px-1"} >
                {oneSection.contents}
                </div>
              </div>
            )

          }

        })

      }
    </div>
  );

};

function Snippet(props) {
  var [messages, setMessages] = useState([]);
  var [body, setBody]         = useState("");
  var [title, setTitle]       = useState("");
  var [tags, setTags]         = useState([]);
  var [ownerId, setOwnerId]   = useState("");

  // I don't know why, but this feels convoluted...
  var [myId, setMyId]         = useState("");

  var snippet_id = queryString.parse(props.location.search, {
    ignoreQueryPrefix: true,
  }).snippetId;

  useEffect(() => {
    // get snippet_id from firestore
    // get actual user name from users table
    var docRef = firestore.collection("snippets").doc(snippet_id);

    docRef
      .get()
      .then(function (doc) {
        if (doc.exists) {
          var snippet = doc.data();
          // If it was a slack snippet, we make the body equal to
          // the content of the messages.
          setBody(snippet.body);
          setTitle(snippet.title);
          if (snippet.hasOwnProperty('tags')) {
            setTags(snippet.tags);
          }

          if (snippet.hasOwnProperty('owner_id')) {
            setOwnerId(snippet.owner_id);
          } else if (snippet.hasOwnProperty('firebase_auth_user_id')) {
            setOwnerId(snippet.firebase_auth_user_id);
          }

        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      })
      .catch(function (error) {
        console.log("Error getting documents: ", error);
      });
  }, []);

  // TODO: make the messages viewer
  //       and body viewer consistent and nicer.
  // Also TODO: make the path modularized.
    return (
      <div>
      <Header history={props.history} setUid={setMyId} />
      <div className="outerContainer py-4">
      <div className="container">
      <div>
        <h2>{title}</h2>
        {
          (myId && myId === ownerId) && (<a href={"/n?snippetId=" + snippet_id}>Edit</a>)
        }

      <div>
        <BodyMarkdown body={body} /></div>
      </div>
      </div>
      </div>
      </div>
    )
}

export default Snippet;
