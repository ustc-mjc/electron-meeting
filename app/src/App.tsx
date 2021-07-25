import React from 'react';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import Meeting from './pages/meeting';
import NewMeeting from './pages/new_meeting';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/meeting/:id" exact={true}>
          <Meeting />
        </Route>
        <Route path="/">
          <NewMeeting />
        </Route>
      </Switch>
    </Router>
    
  );
}

export default App;
