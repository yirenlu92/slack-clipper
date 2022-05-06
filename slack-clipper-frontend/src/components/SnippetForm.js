import React, { useState, useEffect } from "react";

import { auth } from "../base";
import { makeStyles } from "@material-ui/styles";
import Button from "react-bootstrap/Button";
import FormCheck from "react-bootstrap/FormCheck";
import "bootstrap/dist/css/bootstrap.min.css";

import { firestore } from "../base";
import queryString from "query-string";
import universal_styles from './UniversalStyles'

import Header from "./Header"

// TODO: make this mobile-friendly too.

const useStyles = makeStyles({...universal_styles, ...{
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    width: "660px",
    margin: "0 0 25px 0",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  textarea: {
    width: "660px",
    margin: "0 0 25px 0",

  },

  button: {
    width: "auto",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    border: "none",
    padding: "7px",
    textAlign: "center",
  },
  submitButton: {
    width: "160px",
    // margin: "0 0 50px 0",
    // border: "none",
    // padding: "7px",
    // textAlign: "center",
    // backgroundColor: "#4c566a",
    color: "white",
    fontSize: "1.1rem",
    borderRadius: "5px",
    // textTransform: "uppercase",
    padding: "5px",
  },
  googleBtn: {
    width: "450px",
    margin: "0 0 50px 0",
    fontSize: "16px",
  },
  googleBtnImg: {
    width: "16px",
    height: "16px",
    padding: 0,
    margin: "0 5px",
    verticalAlign: "middle",
  },
  errors: {
      color:'red',
  }
}});

const SnippetForm = ( props ) => {
  const classes = useStyles();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const [hasTimestamp, setHasTimestamp] = useState(false);

  const [error, setErrors] = useState("");
  // This is probably a mistake and could be done better.
  // Do it dirty for now. TODO: fix.
  const [uid, setUid] = useState("");

  var dbRef = firestore.collection("snippets");

  // This could be nothing.
  var snippet_id = queryString.parse(props.location.search, {
    ignoreQueryPrefix: true,
  }).snippetId;

  auth.onAuthStateChanged(function (user) {
        if (user) {
            setUid(user.uid);
        }
  });

    // For when it first loads.
    useEffect(() => {
      // Do a firestore lookup, if necessary.

          // All right. If snippet_id is nothing, then it's nothing.
          // What could be better than that?
          if (snippet_id) {
              // Now, we're talking. Let's do a lookup.
            var docRef = dbRef.doc(snippet_id);
            docRef.get()
                .then((doc) => {
                    if (doc.exists) {
                        var snippet = doc.data();
                        setBody(snippet.body);
                        setTitle(snippet.title);
                        if (snippet.tags) {
                          setTags(snippet.tags.join())
                        }
                        if (snippet.hasOwnProperty('isPrivate')) {
                          setIsPrivate(snippet.isPrivate);
                        }
                        if (snippet.hasOwnProperty('timestamp')) {
                          setHasTimestamp(true);
                        }
                    }
                })
          }
      }, [])


 const handleTags = (tagStr) => {
     // Read the tags, separate by commas, set state.
     setTags(tagStr);
 }

  const handleForm = (e) => {
    // OK, now we can start writing stuff to the firestore.

    // I need to figure out if I already exist, and update
    // THAT document instead.

    var docRef;
    if (snippet_id) {
        docRef = dbRef.doc(snippet_id);
    } else {
        docRef = dbRef.doc();
    }

    // Write stuff...
    // Note: I am adding firebase_auth_user_id here too, just because we haven't decided on a standard yet.
    var values = {
        'title': title.trim(),
        'body': body.trim(),
        'isPrivate': isPrivate,
        'tags': [],
        'owner_id': uid,
        'firebase_auth_user_id': uid,
        'edittime': new Date().getTime()/1000,
    };

    // We can backfill timestamps.
    if (!hasTimestamp) {
      values.timestamp = new Date().getTime()/1000;
    }


    if (tags.length > 0) {
        values.tags = tags.split(',');
    }

    // Do some sanity checking now.
    if (body.length == 0) {
        setErrors("Please add something to your snippet before submitting.");
        return;
    }

    docRef.set(values, {'merge': true}).then(()=> {
        // I guess, redirect us?
        props.history.push('/snippet?snippetId=' + docRef.id);
    })
  };

  return (
    <div>
    <Header history={props.history} />
    <div className="outerContainer py-4">
    <div className="container">

  <div className={classes.page}>
      <h3>{snippet_id ? "Edit" : "New"} Snippet</h3>
      <form className={classes.form} >
        <input
          className={classes.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          name="title"
          type="title"
          placeholder="title (optional)"
        />

        <small>Hint: wrap code with ```s</small>
         <textarea
          className={classes.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows="6"
          name="body"
          type="body"
          placeholder="Your Snippet"
         />
        <input
          className={classes.input + " " + ""}
          value={tags}
          onChange={(e) => handleTags(e.target.value)}
          name="tags"
          type="tags"
          placeholder="tags(comma-separated)"
        />

        <FormCheck type="checkbox" label="Private" checked={isPrivate} onChange={(e)=>{setIsPrivate(!isPrivate); }} />

        <hr />
        <Button className={classes.submitButton}  onClick={handleForm} >
          Submit
        </Button>
        <span className={classes.errors} >{error}</span>
      </form>
    </div>
    </div>
    </div>
    </div>
  );
};

export default SnippetForm;
