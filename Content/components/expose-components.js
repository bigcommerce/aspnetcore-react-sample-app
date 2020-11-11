import React from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";

import HomeComponent from "./home.jsx";
import IndexComponent from "./index.jsx";
import Helmet from "react-helmet";

global.React = React;
global.ReactDOM = ReactDOM;
global.ReactDOMServer = ReactDOMServer;

global.Helmet = Helmet;

global.Components = { HomeComponent, IndexComponent };
