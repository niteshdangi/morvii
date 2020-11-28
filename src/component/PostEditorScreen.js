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
} from "react-native";
import { Dimensions, Button, ImageBackground } from "react-native";
import { ImageManipulator } from "expo-image-crop";
import ImageFilters from "react-native-gl-image-filters";
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
import { TouchableOpacity, ScrollView } from "react-native-gesture-handler";
import FlexImage from "react-native-flex-image";
import Swiper from "react-native-swiper";
import * as Constants from "./Constants";
import { setUploadMopic } from "../actions/UploadMopic";
import { Video } from "expo-av";
import notifee, { AndroidColor } from "@notifee/react-native";
import { connect } from "react-redux";
const InputCustom = (props) => {
  const [value, setValue] = React.useState("");
  return (
    <Input
      {...props}
      ref={(ref) => props.reff(ref)}
      value={value}
      onChangeText={setValue}
    />
  );
};
class PostEditorScreen extends Component {
  state = {
    isVisible: false,
    images: this.props.route.params
      ? this.props.route.params.images.slice(0, 15)
      : null,
    date: new Date(),
    caption: "",
    location: "",
    edit: null,
    upload: false,
    xhr: new XMLHttpRequest(),
  };
  componentDidMount() {}
  onToggleModal = () => {
    const { isVisible } = this.state;
    this.setState({ isVisible: !isVisible, edit: null });
  };

  _handleNotification = (notification) => {
    Vibration.vibrate();
    console.log(notification);
    this.setState({ notification: notification });
  };

  render() {
    if (!this.state.isVisible) {
      StatusBar.setBarStyle("dark-content", true);
    } else {
      StatusBar.setBarStyle("light-content", true);
    }
    const { uri, isVisible } = this.state;
    const { width, height } = Dimensions.get("window");
    console.log("render");
    return (
      <Layout
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}>
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
              <UIButton
                onPress={() => {
                  this.state.xhr.abort();
                  this.setState({ upload: false });
                }}
                style={{ marginTop: 15 }}
                size="small"
                status="danger">
                Cancel
              </UIButton>
            </Layout>
          </Layout>
        )}
        <Layout
          style={{
            width: "100%",
            height: 50 + StatusBar.currentHeight,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            paddingTop: StatusBar.currentHeight,
            marginBottom: 10,
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
                New Mopic
              </Text>
            </Layout>
          </Layout>
          <Layout style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{ padding: 10 }}
              onPress={() => {
                // console.log(this.caption.props.value);
                this.props?.route?.params?.MopicPost(
                  this.state.images,
                  this.caption.props.value,
                  this.location.props.value
                );
                this.props.navigation.navigate("BaseApp");
              }}>
              <Layout style={{ flexDirection: "row" }}>
                <Icon
                  name="checkmark"
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: "black",
                  }}
                />
                <Text>Post</Text>
              </Layout>
            </TouchableOpacity>
          </Layout>
        </Layout>
        <Layout style={{ margin: 5, borderRadius: 15, padding: 10 }}>
          <InputCustom
            multiline={true}
            reff={(ref) => (this.caption = ref)}
            // onChangeText={(newValue) => {
            //   this.setState({ caption: newValue });
            // }}
            placeholder="Enter a nice Caption..."
            style={{ backgroundColor: "transparent", maxHeight: 100 }}
          />
          <InputCustom
            reff={(ref) => (this.location = ref)}
            placeholder="Enter Location"
            // onChangeText={(newValue) => {
            //   this.setState({ location: newValue });
            // }}
            style={{ height: 40, backgroundColor: "transparent" }}
          />
        </Layout>
        {this.state.edit !== null && (
          <ImageManipulator
            photo={{ uri: this.state.edit?.uri }}
            isVisible={isVisible}
            onPictureChoosed={({ uri: uriM }) => {
              var imgs = [];
              for (let index = 0; index < this.state.images.length; index++) {
                const element = this.state.images[index];
                if (element.id == this.state.edit.id) {
                  imgs.push({ ...this.state.edit, uri: uriM });
                } else imgs.push(element);
              }
              this.setState({ images: imgs });
            }}
            onToggleModal={this.onToggleModal}
          />
        )}
        <Layout style={{ height: Dimensions.get("screen").width + 80 }}>
          <ScrollView
            horizontal
            snapToInterval={Dimensions.get("screen").width}>
            {this.state.images.map((item, index) => {
              return (
                <Layout
                  key={index}
                  style={{ width: Dimensions.get("screen").width }}>
                  {item.mediaType === "photo" ? (
                    <Layout
                      style={{
                        elevation: 2,
                        margin: 5,
                        borderRadius: 15,
                        paddingBottom: 10,
                        // backgroundColor: "black",
                      }}>
                      <Image
                        source={{ uri: item.uri }}
                        style={{
                          minHeight: Dimensions.get("window").width,
                        }}
                        resizeMode="contain"
                      />
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
                          this.setState({ edit: item, isVisible: true });
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
                    </Layout>
                  ) : (
                    <Layout
                      key={index}
                      style={{
                        elevation: 2,
                        margin: 5,
                        borderRadius: 15,
                        paddingBottom: 70,
                        // backgroundColor: "black",
                      }}>
                      <Video
                        source={{ uri: item.uri }}
                        style={{
                          height: Dimensions.get("window").width,
                          width: Dimensions.get("window").width,
                        }}
                        shouldPlay
                        isMuted={true}
                        useNativeControls
                        posterSource={
                          item.thumbnail
                            ? { uri: item.thumbnail }
                            : require("../../assets/videoPoster.png")
                        }
                        posterStyle={{
                          width: Dimensions.get("window").width,
                          height: Dimensions.get("window").width,
                        }}
                        usePoster
                        resizeMode="cover"
                      />
                    </Layout>
                  )}
                </Layout>
              );
            })}
          </ScrollView>
        </Layout>

        {/* <Layout
          style={{ elevation: 2, margin: 5, borderRadius: 15, padding: 10 }}>
          <Text>Mopic Expiry Date:</Text>

          <Datepicker
            date={this.state.date}
            onSelect={(nextDate) => this.setState({ date: nextDate })}
          />
          <Text appearance="hint">
            *Don't change if you dont want to set Expiry Date
          </Text>
        </Layout> */}
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  user: state.secure.auth,
});

export default connect(mapStateToProps, { setUploadMopic })(PostEditorScreen);
