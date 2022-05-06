import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import { withRouter } from "react-router";
import { makeStyles } from "@material-ui/styles";
import universal_styles from "./UniversalStyles";
import Header from "./Header";
import "../index.css";

const useStyles = makeStyles({
  ...universal_styles,
  ...{
    title: {
      display: "flex",
      flex: 1,
    },
    titlename: {
      fontFamily: "Oxygen,sans-serif",
      fontSize: 50,
      fontWeight: 100,
    },
    subtitlename: {
      fontFamily: "Oxygen,sans-serif",
      fontSize: 30,
      fontWeight: 100,
    },
    leftbody: {
      paddingTop: "5%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "stretch",
      // height: "100vh",
    },
    rightbody: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "stretch",
      height: "100%",
    },
    login: {
      display: "flex",
      justifyContent: "space-between",
    },
  },
});

function Home(props) {
  const classes = useStyles();
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <div className={classes.homepage}>
      <Header history={props.history} signinCallback={setIsSignedIn} />
      <div className="outerContainer">
        <div className="container">
          <div className={classes.leftbody}>
            <div className={classes.titlename}>
              Documentation as easy as chatting
            </div>
            <hr />
            <div className={classes.subtitlename}>
              Easily archive, search, and follow chat conversations, code
              snippets, and config.
            </div>
            <hr />
            <div>
              <Button
                variant="outline-primary"
                size="lg"
                onClick={() => {
                  props.history.push({ pathname: "/signup" });
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(Home);
