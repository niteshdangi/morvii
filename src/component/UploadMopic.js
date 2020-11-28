import React from "react";
import styled from "styled-components";
import { Animated, Dimensions } from "react-native";
import { setUploadMopic } from "../actions/UploadMopic";
import { connect } from "react-redux";
import OptionsModal from "./home/OptionsModal";
import SwipeUpDown from "react-native-swipe-up-down/src";
import { v4 as uuidv4 } from "uuid";
import * as Constants from "../component/Constants";
const screenHeight = Dimensions.get("window").height * 1.2;

class UploadMopic extends React.Component {
  state = {
    top: new Animated.Value(screenHeight),
    formData: [],
  };
  componentDidMount() {
    this.toggleModal();
    this.props.setUploadMopic({ formData: null });
  }
  componentDidUpdate() {
    this.toggleModal();
    if (this.props.UploadMopic.formData !== null) {
      this.upload(this.props.UploadMopic.formData);
      this.props.setUploadMopic({ formData: null });
    }
  }
  shouldComponentUpdate(n, p) {
    if (
      n?.UploadMopic?.state !== p?.UploadMopic?.state ||
      n.formData.length != p.formData.length
    ) {
      return true;
    }
    return false;
  }
  upload(form_data) {
    let formData = new FormData();
    form_data.map((image, index) => {
      let uriParts = image.uri.split(".");
      let fileType = uriParts[uriParts.length - 1];
      formData.append("media" + index, {
        uri: image.uri,
        name: `photo.${fileType}`,
        type: `${image.mediaType}/${fileType}`,
      });
    });
    formData.append("media", form_data.length ? form_data.length : 0);
    const id = uuidv4();
    this.setState({
      formData: { ...this.state.formData, [id]: new Animated.Value(0) },
    });
    var xhr = new XMLHttpRequest();
    xhr.open("POST", Constants.API_URL + "/mopic/create/");
    console.log("OPENED", xhr.status);
    xhr.upload.onprogress = function ({ total, loaded }) {
      console.log("LOADING", total, loaded);
    };
    xhr.onload = function () {
      console.log("DONE", xhr.status);
    };
    xhr.onerror = (err) => {
      console.log(
        JSON.stringify(err, ["message", "arguments", "type", "name"])
      );
    };
    xhr.setRequestHeader("Authorization", "Token " + this.props.user.token);
    xhr.send(formData);
  }
  toggleModal = () => {
    if (this.props.UploadMopic.state) {
      this.swipeUpDownRef.showFull();
      Animated.spring(this.state.top, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(this.state.top, {
        toValue: screenHeight,
        useNativeDriver: true,
      }).start();
    }
  };
  closeModal = () => {
    this.props.setUploadMopic({ state: false });
  };
  render() {
    const Screen = <OptionsModal navigation={this.props.navigation} />;
    return (
      <AnimatedContainer
        style={{
          transform: [{ translateY: this.state.top }],
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
        <SwipeUpDown
          hasRef={(ref) => (this.swipeUpDownRef = ref)}
          itemFull={Screen}
          itemMini={Screen}
          onShowMini={() => this.closeModal()}
          disablePressToShow={false}
          style={{
            backgroundColor: "transparent",
            ...this.props.style,
          }}
        />
      </AnimatedContainer>
    );
  }
}

const Container = styled.View`
  position: absolute;
  background: transparent;
  width: 100%;
  height: 100%;
  z-index: 9999999999;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);

const mapStateToProps = (state) => ({
  UploadMopic: state.main.UploadMopic,
  user: state.secure.auth,
});

export default connect(mapStateToProps, { setUploadMopic })(UploadMopic);
