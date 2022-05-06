import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/styles";
import "bootstrap/dist/css/bootstrap.min.css";
import queryString from "query-string";
import { firestore } from "../base";
import universal_styles from "./UniversalStyles";
import Header from "./Header";
import blue from "@material-ui/core/colors/blue";
import firebaseConfig from "../firebaseConfig";
import SnippetCard from "./SnippetCard";
import BrowseBar from "./BrowseBar";
import { AuthContext } from "../App";

const useStyles = makeStyles({
  ...universal_styles,
  ...{
    container: {},
    label: {
      backgroundColor: blue[50],
    },
    submitButton: {
      width: "160px",
      color: "white",
      fontSize: "1.1rem",
      borderRadius: "5px",
      padding: "5px",
    },
    snippetTitle: {},
    snippetsContainer: {
      display: "flex",
      flexDirection: "column",
      paddingLeft: "0",
      marginBottom: "0",
    },

    snippetCard: {
      position: "relative",
      display: "block",
      padding: "0.75rem 1.25rem",
      marginBottom: "-1px",
      backgroundColor: "#fff",

      borderTop: "1px solid rgba(0, 0, 0, .075)",
      borderBottom: "1px solid rgba(0, 0, 0, .075)",

      width: "100%",
      color: "#495057",
      textAlign: "inherit",
    },
  },
});

function Browse(props) {
  const classes = useStyles();

  const [snippets, setSnippets] = useState([]);
  const [tags, setTags] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [uid, setUid] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const targetUid = useRef("");
  const didMountUid = useRef(false);

  // Fetches this from the url, and saves it so we
  // can pass it down to the child.
  // Note: it looks even after I change tags,
  // the child BrowseBar's state does not get changed.
  var tagStr = queryString.parse(props.location.search, {
    ignoreQueryPrefix: true,
  }).tags;
  // just to prevent being undefined.
  if (!tagStr) {
    tagStr = "";
  }

  var targetUidStr = queryString.parse(props.location.search, {
    ignoreQueryPrefix: true,
  }).tgtUserId;
  if (targetUidStr) {
    targetUid.current = targetUidStr;
    console.log(targetUid.current);
    // This gets read before we start pulling stuff from firestore.
  }

  // I think... I'm going to have to useRef for the user
  // selector, because it's too much work right now to have a
  // whole separate set of selectors for

  // TODO:
  // As we introduce things beyond just tags,
  // we'll need the triggering for the fetch operation to be only done only
  // after ALL the filters are populated.  So I should make the filters a
  // dict and do a read-once.  For now I just want to grab the data.
  const fetchSnippets = (tags) => {
    // If this is non-null, or says "me", restricts the view to
    // the requisite user

    // Does the dirty work.
    var docRef = firestore.collection("snippets");
    if (tags.length > 0 && tags[0] !== "") {
      docRef = docRef.where("tags", "array-contains", tags[0]);
    }

    // Check tgtUid.
    console.log(uid);
    if (targetUid.current === "me" && uid) {
      // fetch using firebase_auth_user_id as the gold standard key
      // try to match the firebase auth uid
      // if that doesn't exist, match by using email
      docRef = docRef.where("firebase_auth_user_id", "==", uid);
      if (docRef.get().length === 0) {
        docRef = docRef.where("user_email", "==", userEmail);
      }
    }

    docRef.get().then((querySnapshot) => {
      // querySnapshot.
      var all_snippets = [];
      querySnapshot.forEach((doc) => {
        // Append the doc to snippets.
        // THIS IS ANNOYING! The snippet body
        // doesn't have its own id.  TODO: fix this.
        var newSnippet = doc.data();
        newSnippet.id = doc.id;
        all_snippets.push(newSnippet);
      });
      setSnippets(all_snippets);
    });

    // TODO: implement some sort of pagination and other stuff.
  };

  const checkFetchSnippets = () => {
    if (isSignedIn && uid !== "") {
      console.log("fetching snippets");
      var tmpTags = tagStr.split(",");
      fetchSnippets(tmpTags);
    }
  };

  useEffect(() => {
    // OK, all sorts of bullshit
    checkFetchSnippets();
  }, [uid, tags, isSignedIn]);

  // Gets the browsing methods...
  // I probably could do this better. And not have the tags be type-changed
  // all the time. TODO: spend a minute and fix this.
  return (
    <div>
      <Header
        history={props.history}
        setIsSignedIn={setIsSignedIn}
        setUid={setUid}
      />

      <div className="outerContainer py-4">
        <div className="container">
          <div className={classes.container}>
            <BrowseBar
              tagStr={tagStr}
              history={props.history}
              setTagsCallback={setTags}
            />
            <div className={classes.snippetsContainer}>
              {snippets.map((s, index) => (
                <SnippetCard key={index} snippet={s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Browse;
