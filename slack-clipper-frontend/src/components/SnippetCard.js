// This is copied from message.js, so it's not supposed
// to look pretty yet.  TODO: make this look prettier.
import React, { useState, useEffect, useRef } from "react";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import "bootstrap/dist/css/bootstrap.min.css";
import Chip from "@material-ui/core/Chip";
import universal_styles from "./UniversalStyles";
import blue from "@material-ui/core/colors/blue";

const useStyles = makeStyles({
  ...universal_styles,
  ...{
    label: {
      backgroundColor: blue[50],
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

function SnippetCard(props) {
  const classes = useStyles();
  // There shouldn't be anything re: fetching here, this should just be individual
  // cards.

  console.log(props.snippet);

  const maxBodyLength = 200;
  return (
    <div>
      <div className={classes.snippetCard}>
        <div>
          <Typography variant="h6" className={classes.snippetTitle}>
            <a href={"/snippet?snippetId=" + props.snippet.id}>
              {props.snippet.title.length > 0
                ? props.snippet.title
                : "[Untitled]"}
            </a>
          </Typography>
        </div>
        <div>
          <Typography variant="caption">
            {props.snippet.body.substr(0, maxBodyLength)}
          </Typography>
        </div>
        <div>
          {props.snippet.tags &&
            props.snippet.tags.map((one_tag, index) => {
              return (
                <Chip
                  label={one_tag}
                  key={index}
                  className={classes.label + " mx-1"}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default SnippetCard;
