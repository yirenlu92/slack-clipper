import React from "react";
import { Card, Typography } from "@material-ui/core";

import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  usernamepadding: {
    marginLeft: "1%",
    fontSize: 10,
  },
});

function Message(props) {
  const classes = useStyles(props);

  return (
    <Card className={classes.card2}>
      <Typography variant="caption" className={classes.usernamepadding}>
        {props.user}
      </Typography>
      <Typography variant="caption">{props.body}</Typography>
    </Card>
  );
}

export default Message;
