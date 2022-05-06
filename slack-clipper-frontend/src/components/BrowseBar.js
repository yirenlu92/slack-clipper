import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { makeStyles } from "@material-ui/styles";
import "bootstrap/dist/css/bootstrap.min.css";
import universal_styles from "./UniversalStyles";

const useStyles = makeStyles({
  ...universal_styles,
  ...{
    submitButton: {
      width: "160px",
      color: "white",
      fontSize: "1.1rem",
      borderRadius: "5px",
      padding: "5px",
    },
  },
});

// Represents the search bar that browse coresponds to.
function BrowseBar(props) {
  const classes = useStyles();

  const [tagStr, setTagStr] = useState("");

  const onSubmitTags = () => {
    // Upon updating the tags, we'll parse and update ourselves.
    // All right.  Here, we get the urlparams, replace the tags parameter, and then
    // redirect
    let tmp_url = new URL(window.location.href);
    tmp_url.searchParams.set("tags", tagStr);

    var redirect_url = tmp_url.toString().replace(window.location.origin, "");

    // TODO: create validation. Also, there's probably a better way to do ^,
    //       but I don't know it right now.
    // Redirect the window to the page, but with slightly different tags.

    //props.history.push(redirect_url);
    // See https://stackoverflow.com/questions/47583856/window-location-href-vs-history-pushstate-which-to-use
    // among others.  We *do* want to reload the window,
    // I believe...
    window.location.href = redirect_url;
  };

  // At the start...

  useEffect(() => {
    setTagStr(props.tagStr);
  }, []);

  return (
    <div>
      <input
        className={classes.input + " mx-1"}
        onChange={(e) => setTagStr(e.target.value)}
        value={tagStr}
        name="tagStr"
        placeholder="Tags (optional)"
      />
      <Button className={classes.submitButton} onClick={onSubmitTags}>
        Search
      </Button>
    </div>
  );
}
export default BrowseBar;
