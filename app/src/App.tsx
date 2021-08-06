import React from 'react';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import Login from './pages/login';
import Meeting from './pages/meeting';
import NewMeeting from './pages/new_meeting';
import Register from './pages/register';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/meeting/:id" exact={true}>
          <Meeting />
        </Route>
        <Route path="/new_meeting" exact={true}>
          <NewMeeting />
        </Route>
        <Route path="/register" exact={true}>
          <Register />
        </Route>
        <Route path="/">
          <Login />
        </Route>
      </Switch>
    </Router>
    
  );
}

export default App;
