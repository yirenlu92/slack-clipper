import React, { useState, useContext } from "react";
import { AuthContext } from "../App";
import { auth } from "../base";
import * as firebase from "firebase";
import { makeStyles } from "@material-ui/styles";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";

const useStyles = makeStyles({
  page: {
    paddingTop: "10%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    maxWidth: "450px",
    width: "auto",
    border: "none",
    margin: "0 0 25px 0",
    padding: "10px",
  },
  button: {
    width: "auto",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    border: "none",
    padding: "7px",
    textAlign: "center",
  },
  submitButton: {
    width: "450px",
    color: "white",
    fontSize: "16px",
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
});

const Login = ({ history }) => {
  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setErrors] = useState("");

  const Auth = useContext(AuthContext);
  const handleForm = (e) => {
    e.preventDefault();
    console.log(Auth);
    console.log(email);
    console.log(password);

    // need to retrieve snippets that belong to this user
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      auth
        .signInWithEmailAndPassword(email, password)
        .then((res) => {
          if (res.user) {
            Auth.setLoggedIn(true);
            // need to make sure that persistence is actually happening before redirection
            history.push({
              pathname: "/b",
              search:
                "?" +
                new URLSearchParams({
                  tgtUserId: "me",
                }).toString(),
              state: {
                tgtUserId: res.user.uid,
              },
            });
          }
        })
        .catch((e) => {
          console.log("there was an error");
          setErrors(e.message);
        });
    });
  };

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      firebase
        .auth()
        .signInWithPopup(provider)
        .then((result) => {
          console.log(result);
          Auth.setLoggedIn(true);
          history.push({
            pathname: "/b",
            search:
              "?" +
              new URLSearchParams({
                tgtUserId: result.user.uid,
              }).toString(),
            state: {
              tgtUserId: result.user.uid,
              tgtUserEmail: result.user.email,
            },
          });
        })
        .catch((e) => setErrors(e.message));
    });
  };

  return (
    <div className={classes.page}>
      <h1>Login</h1>
      <form className={classes.form} onSubmit={(e) => handleForm(e)}>
        <input
          className={classes.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name="email"
          type="email"
          placeholder="email"
        />
        <input
          className={classes.input}
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          value={password}
          type="password"
          placeholder="password"
        />
        <hr />
        <Button className={classes.submitButton} type="submit">
          Login
        </Button>
        <hr />
        <Button
          className={classes.googleBtn}
          onClick={() => signInWithGoogle()}
          class="googleBtn"
          type="button"
        >
          <img
            className={classes.googleBtnImg}
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="logo"
          />
          Login With Google
        </Button>
        <span>{error}</span>
      </form>
    </div>
  );
};

export default Login;
