import React from "react";
import { Layout, Spinner } from "@ui-kitten/components";
import { connect } from "react-redux";
import * as Constants from "./Constants";
import { setCallStatus } from "../actions/CallActions";
import {
  setActiveChat,
  setChatHistory,
  setChatList,
  setChatTheme,
} from "../actions/ChatActions";
import {
  removeGallerySelection,
  setGallerySelection,
} from "../actions/GalleryActions";
import {
  setDarkTheme,
  setMopics,
  setRollTimestamp,
  setVideoMuted,
} from "../actions/HomeActions";
import { setLoggedIn } from "../actions/loginAction";
import { resetOnLogout } from "../actions/TempActions";
import { setUploadMopic } from "../actions/UploadMopic";

const { PureComponent } = require("react");

class Logout extends PureComponent {
  componentDidMount() {
    fetch(Constants.API_URL + "/accounts/logout/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: this.props.auth.token }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        // this.settingsModal.current.close();
      })
      .catch(() => {
        // this.settingsModal.current.close();
      });
    this.props.resetOnLogout();
    this.props.navigation.navigate("Login");
  }
  render() {
    return (
      <Layout
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Spinner />
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, { resetOnLogout })(Logout);
