import { Icon, Input, Layout, Spinner, Text } from "@ui-kitten/components";
import React, { PureComponent } from "react";
import { Dimensions } from "react-native";
import {
  FlatList,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import Image from "react-native-image-progress";
import Animated from "react-native-reanimated";
import FastImage from "react-native-fast-image";
import * as Progress from "react-native-progress";
import Ripple from "react-native-material-ripple";

import * as MediaLibrary from "expo-media-library";
import * as Permissions from "expo-permissions";
// const Image = createImageProgress(FastImage);
export default class Giphy extends PureComponent {
  state = {
    data: [],
    gallery: [],
    type: "gallery",
    loading: true,
    uid: this.props?.uid,
  };

  async getCameraRollPermissions() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === "granted") {
      return true;
    } else {
      console.log("Uh oh! The user has not granted us permission.");
      return false;
    }
  }
  getGiphyTrend() {
    fetch(
      "https://api.giphy.com/v1/" +
        this.state.type +
        "/trending?api_key=BLp12AJExkJK21EMAJeLxSF6IS3YgTwP" +
        "&random_id=" +
        this.state.uid,
      {
        method: "GET",
      }
    )
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ data: data.data, loading: false });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  search(value) {
    if (value)
      fetch(
        "https://api.giphy.com/v1/" +
          this.state.type +
          "/search?api_key=BLp12AJExkJK21EMAJeLxSF6IS3YgTwP&q=" +
          value +
          "&random_id=" +
          this.state.uid,
        {
          method: "GET",
        }
      )
        .then((response) => {
          const statusCode = response.status;
          const data = response.json();
          return Promise.all([statusCode, data]);
        })
        .then(([statusCode, data]) => {
          this.setState({ data: data.data });
        })
        .catch(() => {});
    else this.getGiphyTrend();
  }
  componentDidMount() {
    this.loadGallery();
  }
  loadGallery() {
    if (this.getCameraRollPermissions()) {
      MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: ["photo", "video"],
        sortBy: ["modificationTime"],
      })
        .then((res) => {
          this.setState({
            gallery: res.assets,
            cursor: res.endCursor,
            nextPage: res.hasNextPage,
            bottomLoader: false,
          });
          setTimeout(() => this.setState({ loading: false }), 100);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  loadMore() {
    if (this.state.nextPage) {
      MediaLibrary.getAssetsAsync({
        first: 100,
        after: this.state.cursor,
        mediaType: ["photo", "video"],
        sortBy: ["modificationTime"],
      })
        .then((res) => {
          // console.log(res);
          this.setState({
            gallery: [...this.state.gallery, ...res.assets],
            cursor: res.endCursor,
            nextPage: res.hasNextPage,
            bottomLoader: false,
          });
          setTimeout(() => this.setState({ loading: false }), 100);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  modal = React.createRef();
  render() {
    return (
      <Modalize
        ref={this.modal}
        HeaderComponent={
          <Layout style={{ ...this.props.theme.bgLight }}>
            {this.state.type === "gallery" ? (
              <Text
                style={{
                  margin: 5,
                  borderRadius: 20,
                  marginTop: 10,
                  marginLeft: 20,
                  ...this.props.theme.color,
                }}
                category="h6">
                Gallery
              </Text>
            ) : (
              <Input
                textStyle={{ ...this.props.theme.color }}
                style={{
                  margin: 5,
                  borderRadius: 20,
                  marginTop: 10,
                  borderColor: this.props.theme.bgDark.backgroundColor,
                  ...this.props.theme.bgLight,
                }}
                placeholderTextColor={this.props.theme.bgDark.backgroundColor}
                placeholder="Search Giphy"
                onChangeText={(value) => this.search(value)}
              />
            )}
          </Layout>
        }
        FloatingComponent={
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              elevation: 2,
              borderTopWidth: 1,
              borderColor: this.props.theme.bgDark.backgroundColor,
              ...this.props?.theme?.bg,
            }}>
            <Ripple
              onPress={() => {
                if (this.state.type !== "gallery") {
                  this.setState({ type: "gallery" });
                  if (this.state.gallery.length === 0) this.loadGallery();
                }
              }}
              style={{
                width: Dimensions.get("window").width / 3,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 10,
              }}>
              <Icon
                name="image-outline"
                style={{ width: 25, height: 25, ...this.props.theme.color }}
              />
            </Ripple>
            <Ripple
              onPress={() => {
                if (this.state.type !== "stickers") {
                  this.setState({ type: "stickers", data: [] });
                  this.getGiphyTrend();
                }
              }}
              style={{
                width: Dimensions.get("window").width / 3,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 10,
              }}>
              <Icon
                name="smiling-face-outline"
                style={{ width: 25, height: 25, ...this.props.theme.color }}
              />
            </Ripple>
            <Ripple
              onPress={() => {
                if (this.state.type !== "gifs") {
                  this.setState({ type: "gifs", data: [] });
                  this.getGiphyTrend();
                }
              }}
              style={{
                width: Dimensions.get("window").width / 3,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 10,
              }}>
              <Icon
                name="smiling-face-outline"
                style={{ width: 25, height: 25, ...this.props.theme.color }}
              />
            </Ripple>
          </Layout>
        }
        snapPoint={Dimensions.get("screen").height / 2 + 50}
        modalStyle={{
          overflow: "hidden",
        }}
        closeSnapPointStraightEnabled={false}
        rootStyle={{
          elevation: 5,
          zIndex: 100000,
        }}
        flatListProps={{
          data:
            this.state.type === "gallery"
              ? this.state.gallery
              : this.state.data,
          onEndReached: () => {
            this.state.type === "gallery" ? this.loadMore() : null;
          },
          style: { ...this.props.theme.bgLight },
          renderItem: ({ item, index }) => (
            <TouchableWithoutFeedback
              key={index}
              onPress={() => {
                this.modal.current.close();
                this.props?.send({
                  type: this.state.type,
                  url:
                    this.state.type === "gallery"
                      ? { ...item }
                      : item.images.fixed_width.url,
                });
                if (this.state.type !== "gallery") {
                  fetch(item.analytics.onclick.url, {
                    method: "GET",
                  });
                  fetch(item.analytics.onsent.url, {
                    method: "GET",
                  });
                }
              }}
              style={{
                borderRadius: this.state.type === "stickers" ? 0 : 10,
                overflow: "hidden",
                elevation: this.state.type === "stickers" ? 0 : 2,
                margin: 10,
                backgroundColor:
                  this.state.type === "stickers"
                    ? this.props.theme.bgLight.backgroundColor
                    : "#000",
              }}>
              <Image
                indicator={Spinner}
                indicatorProps={{
                  size: 30,
                  borderWidth: 0,
                  color: "rgba(150, 150, 150, 1)",
                  unfilledColor: "rgba(200, 200, 200, 0.2)",
                }}
                key={index}
                source={{
                  uri:
                    this.state.type === "gallery"
                      ? item.uri
                      : item.images.fixed_width.url,
                }}
                onload={() => {
                  !this.state.type === "gallery" &&
                    fetch(item.analytics.onload.url, {
                      method: "GET",
                    });
                }}
                style={{
                  width:
                    this.state.type === "stickers"
                      ? Dimensions.get("screen").width / 3 - 20
                      : Dimensions.get("screen").width / 2 - 20,
                  height:
                    this.state.type === "stickers"
                      ? Dimensions.get("screen").width / 3 - 20
                      : Dimensions.get("screen").width / 2 - 20,
                }}
                resizeMode={
                  this.state.type === "stickers" ? "contain" : "contain"
                }
              />
              {this.state.type === "gallery"
                ? item.mediaType === "video" && (
                    <Layout
                      style={{
                        position: "absolute",
                        bottom: 5,
                        left: 5,
                        padding: 5,
                        backgroundColor: "blue",
                        borderRadius: 50,
                        zIndex: 100,
                        elevation: 2,
                      }}>
                      <Icon
                        name="video-outline"
                        style={{ width: 25, height: 25, tintColor: "#fff" }}
                      />
                    </Layout>
                  )
                : null}
            </TouchableWithoutFeedback>
          ),
          numColumns: this.state.type === "stickers" ? 3 : 2,
          key: this.state.type === "stickers" ? 3 : 2,
          initialNumToRender: 8,
          ListEmptyComponent: (
            <Layout
              style={{
                justifyContent: "center",
                alignItems: "center",
                height: 150,
                backgroundColor: "transparent",
              }}>
              <Spinner />
            </Layout>
          ),
        }}
      />
    );
  }
}
class GiphyItem extends PureComponent {
  render() {
    const { item } = this.props;
    return (
      <Layout
        style={{
          borderWidth: 1,
          width: Dimensions.get("screen").width / 2,
          height: Dimensions.get("screen").width / 2,
        }}>
        <Image
          source={{ uri: item.images.original.webp }}
          style={{
            width: Dimensions.get("screen").width / 2,
            height: Dimensions.get("screen").width / 2,
          }}
          resizeMode="cover"
        />
      </Layout>
    );
  }
}
