import React, { useState, useEffect } from "react";
import Home from "./components/Home";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import SnippetForm from "./components/SnippetForm";
import Browse from "./components/Browse";
import PublicBrowse from "./components/PublicBrowse";

import Snippet from "./components/Snippet";
import firebaseConfig from "./firebaseConfig";

import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import history from "./history.js";

export const AuthContext = React.createContext(null);

function App(props) {
  const [isLoggedIn, setLoggedIn] = useState(false);

  function readSession() {
    const user = window.sessionStorage.getItem(
      `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`
    );
    if (user) setLoggedIn(true);
  }
  useEffect(() => {
    readSession();
  }, []);

  // TODO: figure out how to pull/grab routing arguments.
  // TODO: rename "/snippet" to something else, like slacksnippet.
  //       so we can use that as a direct entry point to going->db.
  return (
    <AuthContext.Provider value={{ isLoggedIn, setLoggedIn }}>
      <Router history={history}>
        <div id="app">
          <Switch>
            <Route
              path="/"
              exact
              render={(props) => (
                <Home
                  {...props}
                  isLoggedIn={isLoggedIn}
                  setLoggedIn={setLoggedIn}
                />
              )}
            />
            <Route exact path="/signup" component={SignUp} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/n" component={SnippetForm} />
            <Route exact path="/b" component={Browse} />
            <Route exact path="/p" component={PublicBrowse} />
            <Route exact path="/snippet" component={Snippet} />
          </Switch>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
