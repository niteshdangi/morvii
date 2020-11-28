import React from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
  StatusBar,
} from "react-native";
import { setShortModal } from "../../actions/ShortModal";
import { connect } from "react-redux";
import { Layout, Text, Divider, Spinner, Icon } from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import ProfileScreen from "../ProfileScreen";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const screenHeight = Dimensions.get("window").height * 1.2;

class ProfileModal extends React.Component {
  closeModal = () => {
    this.props.setShortModal(false, "Loading");
  };
  pan = new Animated.Value(0);
  panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (e, { dy }) => {
      Animated.timing(this.pan, {
        toValue: dy / 3,
        duration: 0,
        useNativeDriver: false,
      }).start();
    },
    onPanResponderRelease: (e, { vy, dy }) => {
      if (Math.abs(vy) >= 0.5 || Math.abs(dy) >= 0.5 * screenHeight) {
        Animated.timing(this.pan, {
          toValue:
            dy > 0 ? screenHeight : -(Dimensions.get("window").height / 2 - 50),
          duration: 100,
          useNativeDriver: false,
        }).start();
        if (dy > 0) {
          setTimeout(() => this.closeModal(), 50);
        } else {
          setTimeout(() => {
            this.props.navigation.navigate("ProfileScreen", {
              username: this.props.ShortModal.props.username,
            });
            this.closeModal();
          }, 100);
        }
      } else {
        Animated.spring(this.pan, {
          toValue: 0,
          bounciness: 10,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  render() {
    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.98, 0.95],
    });
    let transformStyle = {
      transform: [{ scale: cardScale }],
    };
    // console.log(Dimensions.get("screen").height,Dimensions.get);
    if (
      this.props.ShortModal.props.load &&
      this.props.ShortModal.props.username
    )
      return (
        <Layout
          style={{
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            backgroundColor: "transparent",
          }}>
          <Spinner />
        </Layout>
      );
    this.props.ShortModal.props.username ? null : this.closeModal();
    return (
      <Animated.View
        style={{
          transform: [{ translateY: this.pan }],
        }}
        {...this.panResponder.panHandlers}>
        <Header />
        <ProfileImage>
          <Layout
            style={{
              height: Dimensions.get("screen").height / 2 + 20,
            }}>
            <Image
              source={{
                uri: this.props.ShortModal.props?.profile?.image,
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </Layout>
        </ProfileImage>
        <Body>
          <Layout
            style={{
              elevation: 5,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderRadius: 15,
              margin: 15,
              marginTop: -50,
              padding: 10,
              paddingHorizontal: 15,
            }}>
            <Layout
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  backgroundColor: "transparent",
                }}>
                <TouchableWithoutFeedback
                  style={{ marginTop: -30, marginLeft: -10, elevation: 3 }}
                  onPressIn={() => {
                    scaleValue.setValue(0);
                    Animated.timing(scaleValue, {
                      toValue: 1,
                      duration: 150,
                      easing: Easing.linear,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.timing(scaleValue, {
                      toValue: 0,
                      duration: 100,
                      easing: Easing.linear,
                      useNativeDriver: true,
                    }).start();
                  }}>
                  <Animated.View style={transformStyle}>
                    <Layout
                      style={{
                        borderRadius: 5,
                        backgroundColor: "transparent",
                        elevation: 3,
                        margin: 10,
                      }}>
                      <Image
                        source={{
                          uri: this.props.ShortModal.props?.profile?.image,
                        }}
                        style={{
                          width: 50,
                          height: 70,
                          borderRadius: 5,
                        }}
                      />
                    </Layout>
                  </Animated.View>
                </TouchableWithoutFeedback>
                <Layout
                  style={{
                    justifyContent: "space-evenly",
                    backgroundColor: "transparent",
                  }}>
                  {(
                    this.props.ShortModal.props?.first_name +
                    this.props.ShortModal.props?.last_name
                  ).trim() !== "" && (
                    <Text category="h5">
                      {this.props.ShortModal.props?.first_name +
                        " " +
                        this.props.ShortModal.props?.last_name}
                    </Text>
                  )}
                  <Text
                    appearance={
                      (
                        this.props.ShortModal.props?.first_name +
                        this.props.ShortModal.props?.last_name
                      ).trim() !== ""
                        ? "hint"
                        : "default"
                    }
                    style={{ marginTop: -5 }}>
                    @{this.props.ShortModal.props?.username}
                  </Text>
                </Layout>
              </Layout>
              <Layout style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon
                  name="star-outline"
                  style={{ width: 30, height: 30 }}
                  fill="black"
                />
                <Text style={{ marginLeft: 5 }}>
                  {this.props.ShortModal.props?.profile?.rating}
                </Text>
              </Layout>
            </Layout>
          </Layout>

          <Layout
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "transparent",
              height: Dimensions.get("screen").height / 2,
            }}>
            <Spinner />
          </Layout>
        </Body>
      </Animated.View>
    );
  }
}

const Header = styled.View`
  height: ${Dimensions.get("window").height / 2 - 50}px;
`;

const ProfileImage = styled.View`
  width: 100%;
  background: #333;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: hidden;
`;

const Body = styled.View`
  background: #eaeaea;
  height: ${screenHeight};
`;

const CloseView = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: white;
  justify-content: center;
  align-items: center;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
`;
const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
});

export default connect(mapStateToProps, { setShortModal })(ProfileModal);
