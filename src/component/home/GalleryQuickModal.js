import React from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  View,
  ToastAndroid,
} from "react-native";
import * as Icon from "@expo/vector-icons";
import { setShortModal } from "../../actions/ShortModal";
import { connect } from "react-redux";
import { Layout, Text, Divider } from "@ui-kitten/components";
import FlexImage from "react-native-flex-image";
import Mopic from "./mopic";
import { TouchableRipple } from "react-native-paper";
import Ripple from "react-native-material-ripple";
import { Video } from "expo-av";

const screenHeight = Dimensions.get("window").height * 1.2;

class GalleryQuickModal extends React.Component {
  state = {
    top: new Animated.Value(screenHeight),
    topFixed: new Animated.Value(115),
  };
  componentDidMount() {
    this.toggleModal();
    this.toggleFixed();
  }
  componentDidUpdate() {
    this.toggleModal();
    this.toggleFixed();
  }

  toggleModal = () => {
    if (this.props.ShortModal.action) {
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

  toggleFixed = () => {
    if (this.props.ShortModal.props.fixed) {
      Animated.spring(this.state.topFixed, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(this.state.topFixed, {
        toValue: 115,
        useNativeDriver: true,
      }).start();
    }
  };

  closeModal = () => {
    this.props.setShortModal(false, "Loading");
  };

  render() {
    const { item } = this.props.ShortModal.props;
    if (!item) return <Text>Please Wait...</Text>;
    return (
      <AnimatedContainer>
        <Layout
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: Dimensions.get("window").height,
            backgroundColor: "black",
            padding: 20,
            paddingTop: 0,
            height: Dimensions.get("screen").height,
          }}>
          {item.mediaType == "photo" ? (
            <Image
              style={{
                width: Dimensions.get("window").width,
                height: Dimensions.get("window").height,
              }}
              resizeMode="contain"
              source={{ uri: item.uri }}
            />
          ) : (
            <Video
              style={{
                width: Dimensions.get("window").width,
                height: Dimensions.get("window").height,
              }}
              resizeMode="contain"
              source={{ uri: item.uri }}
              onError={() => {
                ToastAndroid.show("Failed To Load Video", ToastAndroid.LONG);
                this.closeModal();
              }}
              useNativeControls
              shouldPlay
            />
          )}
        </Layout>
      </AnimatedContainer>
    );
  }
}

const Container = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
});

export default connect(mapStateToProps, { setShortModal })(GalleryQuickModal);
