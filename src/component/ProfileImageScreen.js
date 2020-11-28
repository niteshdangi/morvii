import React, { Component } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  ToastAndroid,
  StatusBar,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as Permissions from "expo-permissions";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageManipulator } from "expo-image-crop";
import { connect } from "react-redux";

import {
  Text,
  Layout,
  Icon,
  Spinner,
  Divider,
  Button,
} from "@ui-kitten/components";
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native-gesture-handler";
import * as Constants from "./Constants";
import Ripple from "react-native-material-ripple";
import GalleryImage from "./utils/GalleryImage";
import { setLoggedIn } from "../actions/loginAction";
class ProfileImageScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      selected: null,
      image: null,
      xhr: new XMLHttpRequest(),
    };
  }

  async getCameraRollPermissions() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === "granted") {
      return true;
    } else {
      console.log("Uh oh! The user has not granted us permission.");
      return false;
    }
  }
  async componentDidMount() {
    if (!this.props?.route?.params?.type) {
      this.props.navigation.goBack();
    }
    if (this.getCameraRollPermissions()) {
      MediaLibrary.getAssetsAsync({
        mediaType: ["photo"],
      })
        .then((res) => {
          MediaLibrary.getAssetsAsync({
            first: res.totalCount,
            mediaType: ["photo"],
            sortBy: ["modificationTime"],
          })
            .then((res) => {
              this.setState({
                data: res.assets,
                cursor: res.endCursor,
                nextPage: res.hasNextPage,
              });
              setTimeout(() => this.setState({ loading: false }), 100);
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  onToggleModal() {
    this.setState({ selected: null });
  }
  formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  saveProfile() {
    this.setState({ upload: true });
    let formData = new FormData();
    let uriParts = this.state.image.uri.split(".");
    let fileType = uriParts[uriParts.length - 1];
    formData.append(
      this.props.route.params.type === "primary"
        ? "imagePrimary"
        : "imageSecondary",
      {
        uri: this.state.image.uri,
        name: `photo.${fileType}`,
        type: `${this.state.image.mediaType}/${fileType}`,
      }
    );
    var xhr = this.state.xhr;
    const self = this;
    xhr.open("PUT", Constants.API_URL + "/accounts/profile/");

    xhr.upload.onprogress = function ({ total, loaded }) {
      total = self.formatBytes(total);
      loaded = self.formatBytes(loaded);
      self.setState({ status: { loaded, total, error: false } });
    };
    xhr.onload = function () {
      self.props.setLoggedIn({
        state: true,
        token: self.props.user.token,
        user: JSON.parse(xhr.response).user,
      });
      ToastAndroid.show(
        "New Profile Picture will be Visible in Some Time",
        ToastAndroid.LONG
      );
      self.props.navigation.goBack();
    };
    xhr.onerror = function (e) {
      self.setState({ upload: false });
      xhr.abort();
      ToastAndroid.show(
        self.state.status ? "Failed To Upload" : "Image Size too big",
        ToastAndroid.LONG
      );
    };
    xhr.setRequestHeader("Authorization", "Token " + this.props.user.token);
    xhr.send(formData);
  }
  componentDidUpdate() {}
  render() {
    return (
      <SafeAreaView>
        {this.state.selected !== null && (
          <ImageManipulator
            photo={{ uri: this.state.selected.uri }}
            isVisible={true}
            onPictureChoosed={({ uri: uriM }) => {
              this.setState({
                image: { ...this.state.selected, uri: uriM },
              });
            }}
            onToggleModal={this.onToggleModal.bind(this)}
          />
        )}
        {this.state.upload && (
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
              <Text style={{ paddingVertical: 10 }} category="h6">
                Uploading...
              </Text>
              <Divider />
              <Layout
                style={{
                  flexDirection: "row",
                  padding: 10,
                  justifyContent: "space-between",
                }}>
                <Spinner size="large" />
                <Layout>
                  <Text>
                    {this.state?.status?.loaded} / {this.state?.status?.total}
                  </Text>
                </Layout>
              </Layout>
              <Divider />
              <Button
                onPress={() => {
                  this.state.xhr.abort();
                  this.setState({ upload: false });
                }}
                style={{ marginTop: 15 }}
                size="small"
                status="danger">
                Cancel
              </Button>
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
                this.props.navigation.goBack();
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
                {this.props?.route?.params?.type == "primary"
                  ? "Profile Picture"
                  : "Secondary Profile Picture"}
              </Text>
            </Layout>
          </Layout>
          {this.state.image ? (
            <Ripple
              style={{ padding: 10 }}
              onPress={() => {
                this.saveProfile();
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Text style={{ fontSize: 18, marginTop: -3 }}>Save</Text>
                <Icon
                  name="arrow-right"
                  style={{
                    width: 27,
                    height: 27,
                    tintColor: "black",
                  }}
                />
              </Layout>
            </Ripple>
          ) : null}
        </Layout>
        {this.state.image && (
          <Layout
            style={{ height: Dimensions.get("screen").width, marginBottom: 5 }}>
            <TouchableOpacity
              style={{
                padding: 10,
                margin: 10,
                backgroundColor: "rgba(0,0,0,0.5)",
                width: 80,
                borderRadius: 50,
                elevation: 10,
              }}
              onPress={() => {
                this.setState({ selected: this.state.image });
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                }}>
                <Icon
                  name="edit"
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: "white",
                  }}
                />
                <Text style={{ color: "white" }}>Edit</Text>
              </Layout>
            </TouchableOpacity>
            <Image
              style={{
                width: Dimensions.get("window").width,
                height: Dimensions.get("screen").width,
                marginTop: -70,
                zIndex: -1,
              }}
              resizeMode="contain"
              source={{ uri: this.state.image.uri }}
            />
          </Layout>
        )}
        {this.state.loading ? (
          <Layout
            style={{
              justifyContent: "center",
              flex: 1,
              alignItems: "center",
              height: 500,
              marginTop: 50,
            }}>
            <Spinner shouldRasterizeIOS size="large" />
            <Text>Gallery Loading...</Text>
          </Layout>
        ) : (
          <FlatList
            data={this.state.data}
            extraData={this.state.data}
            numColumns={4}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Ripple
                onPress={() => {
                  this.setState({ image: item });
                }}
                style={{ margin: 1 }}>
                <Image
                  style={{
                    width: Dimensions.get("window").width / 4 - 4,
                    height: 100,
                  }}
                  resizeMode="cover"
                  source={{ uri: item.uri }}
                />
              </Ripple>
            )}
          />
        )}
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({
  user: state.secure.auth,
});
export default connect(mapStateToProps, { setLoggedIn })(ProfileImageScreen);
