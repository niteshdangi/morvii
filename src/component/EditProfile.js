import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Slider,
  Image,
  StatusBar,
  ToastAndroid,
  Vibration,
  Platform,
  BackHandler,
} from "react-native";
import { Dimensions, Button, ImageBackground } from "react-native";
import { ImageManipulator } from "expo-image-crop";
import { setLoggedIn } from "../actions/loginAction";
import ImageFilters from "react-native-gl-image-filters";
import * as Constants from "./Constants";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  Layout,
  Icon,
  Divider,
  Datepicker,
  Text,
  Spinner,
  Button as UIButton,
  Input,
} from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";

import { connect } from "react-redux";
class EditProfile extends Component {
  state = {
    saving: false,
    first_name: this.props.auth.user.first_name,
    last_name: this.props.auth.user.last_name,
    bio: this.props.auth.user.profile.bio,
  };
  componentDidMount() {
    this.backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick.bind(this)
    );
  }
  handleBackButtonClick() {
    if (
      this.state?.first_name !== this.props?.auth.user.first_name ||
      this.state?.last_name !== this.props?.auth.user.last_name ||
      this.state?.bio !== this.props?.auth.user.profile.bio
    ) {
      this.setState({ saving: true });
      fetch(Constants.API_URL + "/accounts/profile/", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.state),
      })
        .then((response) => {
          const statusCode = response.status;
          const data = response.json();
          return Promise.all([statusCode, data]);
        })
        .then(([statusCode, data]) => {
          if (statusCode === 200) {
            this.props.setLoggedIn({
              state: true,
              token: this.props.auth.token,
              user: data.user,
            });
            this.props.navigation.goBack();
          } else {
            this.props.navigation.goBack();
          }
        })
        .catch(() => {
          this.props.navigation.goBack();
        });
      return true;
    }
    this.props.navigation.goBack();
    return true;
  }
  componentWillUnmount() {
    this.backHandler.remove();
  }
  render() {
    return (
      <SafeAreaView
        style={{
          flex: 1,
        }}>
        {this.state.saving && (
          <Layout
            style={{
              position: "absolute",
              backgroundColor: "rgba(0,0,0,0.5)",
              width: Dimensions.get("screen").width,
              height: Dimensions.get("screen").height,
              justifyContent: "center",
              alignItems: "center",
              elevation: 5,
              zIndex: 200,
            }}>
            <Layout
              style={{
                elevation: 6,
                width: Dimensions.get("screen").width - 100,
                padding: 10,
                borderRadius: 10,
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  padding: 10,
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}>
                <Spinner size="large" />
                <Layout style={{ paddingLeft: 10 }}>
                  <Text>Saving...</Text>
                </Layout>
              </Layout>
            </Layout>
          </Layout>
        )}
        <Layout
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            elevation: 2,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Ripple
              style={{ padding: 10 }}
              onPress={() => {
                this.handleBackButtonClick();
              }}>
              <Icon
                name="arrow-back-outline"
                style={{
                  width: 27,
                  height: 27,
                  tintColor: "black",
                }}
              />
            </Ripple>
            <Layout style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 18, paddingLeft: 10, marginTop: -5 }}>
                Edit Profile
              </Text>
            </Layout>
          </Layout>
        </Layout>
        <Ripple
          onPress={() => {
            this.props.navigation.navigate("ProfileImageScreen", {
              type: "primary",
            });
          }}>
          <Layout
            style={{
              padding: 10,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              backgroundColor: "transparent",
            }}>
            <Image
              source={{ uri: this.props.auth.user.profile.image }}
              style={{
                width: 70,
                height: 70,
                borderRadius: 70,
                borderWidth: 1,
              }}
              resizeMode="cover"
            />
            <Layout style={{ marginLeft: 10, backgroundColor: "transparent" }}>
              <Text category="h6">Edit Profile Picture</Text>
              <Text appearance="hint" style={{ fontSize: 11, width: "80%" }}>
                {this.props.auth.user.profile.private
                  ? "This image will be appear only your followers"
                  : "This image will visible to all"}
              </Text>
            </Layout>
          </Layout>
        </Ripple>
        {this.props.auth.user.profile.private && (
          <Ripple
            onPress={() =>
              this.props.navigation.navigate("ProfileImageScreen", {
                type: "secondary",
              })
            }>
            <Layout
              style={{
                padding: 10,
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "transparent",
              }}>
              <Image
                source={{ uri: this.props.auth.user.profile.image_secondary }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 70,
                  borderWidth: 1,
                }}
                resizeMode="cover"
              />
              <Layout
                style={{ marginLeft: 10, backgroundColor: "transparent" }}>
                <Text category="h6">Edit Secondary Profile Picture</Text>
                <Text appearance="hint" style={{ fontSize: 11, width: "80%" }}>
                  {!this.props.auth.user.profile.private
                    ? ""
                    : "This image will visible to users who does not follow you "}
                </Text>
              </Layout>
            </Layout>
          </Ripple>
        )}
        <Input
          disabled={this.state.saving}
          ref={(input) => {
            this.firstNameInput = input;
          }}
          placeholder="First Name"
          value={this.state.first_name}
          onChangeText={(nextValue) => {
            this.setState({ first_name: nextValue });
          }}
          //   accessoryRight={renderIcon}
          onSubmitEditing={() => this.lastNameInput?.focus()}
          returnKeyType="next"
          style={{
            paddingHorizontal: 10,
            paddingVertical: 2.5,
            paddingTop: 10,
          }}
        />
        <Input
          disabled={this.state.saving}
          ref={(input) => {
            this.lastNameInput = input;
          }}
          placeholder="Last Name"
          value={this.state.last_name}
          onChangeText={(nextValue) => {
            this.setState({ last_name: nextValue });
          }}
          //   accessoryRight={renderIcon}
          onSubmitEditing={() => {
            this.bioInput?.focus();
          }}
          returnKeyType="next"
          style={{ paddingHorizontal: 10, paddingVertical: 2.5 }}
        />
        <Input
          disabled={this.state.saving}
          ref={(input) => {
            this.bioInput = input;
          }}
          multiline={true}
          placeholder="About"
          value={this.state.bio}
          onChangeText={(nextValue) => {
            this.setState({ bio: nextValue });
          }}
          maxLength={255}
          //   accessoryRight={renderIcon}
          //   onSubmitEditing={onPress}
          style={{ paddingHorizontal: 10, paddingVertical: 2.5 }}
        />
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setLoggedIn })(EditProfile);
