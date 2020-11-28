import React from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  View,
} from "react-native";
import * as Icon from "@expo/vector-icons";
import { setShortModal } from "../actions/ShortModal";
import { connect } from "react-redux";
import { Layout, Text, Divider, Spinner } from "@ui-kitten/components";
import ProfileModal from "./home/profileModal";
import ExploreQuickModal from "./home/ExploreQuickModal";
import OptionsModal from "./home/OptionsModal";
import SwipeUpDown from "react-native-swipe-up-down/src";
import GalleryQuickModal from "./home/GalleryQuickModal";
import StoryModal from "./utils/StoryModal";

const screenHeight = Dimensions.get("window").height * 1.2;

class ShortModal extends React.Component {
  state = {
    top: new Animated.Value(screenHeight),
  };
  componentDidMount() {
    this.toggleModal();
  }
  componentDidUpdate() {
    this.toggleModal();
  }

  toggleModal = () => {
    if (this.props.ShortModal.action) {
      this.props.ShortModal.type === "Profile" ||
      this.props.ShortModal.type === "StoryView"
        ? null
        : this?.swipeUpDownRef?.showFull();
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
    this.props.setShortModal(false, "Loading");
  };
  render() {
    const Screen =
      this.props.ShortModal.type === "GalleryQuick" ? (
        <GalleryQuickModal />
      ) : this.props.ShortModal.type === "Options" ? (
        <OptionsModal navigation={this.props.navigation} />
      ) : this.props.ShortModal.type === "Loader" ? (
        <Layout
          style={{
            backgroundColor: "transparent",
            justifyContent: "center",
            alignItems: "center",
            height: Dimensions.get("screen").height,
          }}>
          <Spinner />
        </Layout>
      ) : null;
    return (
      <AnimatedContainer
        style={{
          transform: [{ translateY: this.state.top }],
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
        {this.props.ShortModal.type === "Profile" ? (
          <ProfileModal navigation={this.props.navigation} />
        ) : this.props.ShortModal.type === "StoryView" ? (
          <StoryModal navigation={this.props.navigation} />
        ) : (
          <SwipeUpDown
            hasRef={(ref) => (this.swipeUpDownRef = ref)}
            itemFull={Screen}
            itemMini={Screen}
            onShowMini={() => this.closeModal()}
            disablePressToShow={false}
            style={{
              backgroundColor: "transparent",
              margin: 0,
              padding: 0,
              ...this.props.style,
            }}
          />
        )}
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
  ShortModal: state.main.ShortModal,
});

export default connect(mapStateToProps, { setShortModal })(ShortModal);
