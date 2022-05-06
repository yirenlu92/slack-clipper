import React, { useState, useEffect, useContext } from "react";
import Button from "react-bootstrap/Button";

import "bootstrap/dist/css/bootstrap.min.css";
import { Typography } from "@material-ui/core";

import { makeStyles } from "@material-ui/styles";
import universal_styles from "./UniversalStyles";
import { AppBar, Toolbar } from "@material-ui/core";
import { auth } from "../base";

const useStyles = makeStyles({
  ...universal_styles,
  ...{
    toolbar: {
      paddingLeft: "20%",
      paddingRight: "20%",
      display: "flex",
      justifyContent: "space-between",
    },
    body: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "stretch",
    },
    logoName: {
      fontFamily: "Oxygen,sans-serif",
      fontSize: 30,
      fontWeight: 500,
      color: "black",
      cursor: "pointer",
    },
  },
});

function Header(props) {
  const classes = useStyles();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);

  auth.onAuthStateChanged(function (user) {
    // Tell its parent if it exists.
    if (user) {
      setIsSignedIn(true);
      if (props.hasOwnProperty("setIsSignedIn")) {
        props.setIsSignedIn(true);
      }

      // Also pass userid also if need be.
      if (props.hasOwnProperty("setUid")) {
        props.setUid(user.uid);
      }
    } else {
      setIsSignedIn(false);
      if (props.hasOwnProperty("setIsSignedIn")) {
        props.setIsSignedIn(false);
      }
    }
    // This is a pretty ugly solution, but basically
    // I wanted to not load header links until we hear from firebase that we're
    // logged in or not.  Otherwise, we create a flickering, which is annoying.
    setAuthCompleted(true);
  });

  function handleLoginClick() {
    props.history.push({
      pathname: "/login",
    });
  }

  function redirectToHome() {
    props.history.push({
      pathname: "/",
    });
  }

  function logout() {
    auth.signOut();
    // setIsSignedIn(false);
    props.history.push({
      pathname: "/",
    });
  }

  function handleSignUpClick() {
    props.history.push({
      pathname: "/signup",
    });
  }

  return (
    <Toolbar className={classes.toolbar}>
      <div className={classes.logoName} onClick={redirectToHome}>
        Jot
      </div>
      <div>
        {authCompleted && isSignedIn && (
          <div>
            <a className="p-2 text-muted" href="/p">
              Browse All
            </a>
            <a className="p-2 text-muted" href="/b?tgtUserId=me">
              My Snippets
            </a>
            <a className="p-2 text-muted" href="/n">
              New
            </a>

            <Button color="secondary" onClick={logout} className={"mx-1"}>
              Logout
            </Button>
          </div>
        )}
        {authCompleted && !isSignedIn && (
          <div>
            <a className="p-2 text-muted" href="/p">
              Browse
            </a>
            <Button
              color="secondary"
              onClick={handleSignUpClick}
              className={"mx-1"}
            >
              Sign Up
            </Button>
            <Button color="secondary" onClick={handleLoginClick}>
              Login
            </Button>
          </div>
        )}
      </div>
    </Toolbar>
  );
}

// TODO: I should read up on the diff between default- and
//       named- exports, and understand it.
export default Header;
