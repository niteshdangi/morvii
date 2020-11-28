import React, { Component } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  ToastAndroid,
  StatusBar,
  Animated,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as Permissions from "expo-permissions";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, Layout, Icon, Spinner } from "@ui-kitten/components";
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native-gesture-handler";
import Ripple from "react-native-material-ripple";
import { connect } from "react-redux";
import GalleryImage from "./utils/GalleryImage";
export default class GalleryScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: "",
      loading: true,
      selected: [],
      bottomLoader: false,
      errorCount: 0,
      error: false,
    };
  }
  select = (item) => {
    if (this.state.selected.length === 0) {
      Animated.spring(this.nextBt, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
    this.setState({ selected: [...this.state.selected, item] });
  };
  unselect = (item) => {
    if (this.state.selected.length === 1) {
      Animated.spring(this.nextBt, {
        toValue: 100,
        useNativeDriver: false,
      }).start();
    }
    var list = [];
    for (let index = 0; index < this.state.selected.length; index++) {
      const element = this.state.selected[index];
      if (element.id !== item.id) {
        list.push(element);
      }
    }
    this.setState({ selected: list });
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
  async componentDidMount() {
    StatusBar.setBarStyle("dark-content", true);
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
          // console.log(res);
          this.setState({
            data: res.assets,
            cursor: res.endCursor,
            nextPage: res.hasNextPage,
            bottomLoader: false,
            errorCount: 0,
            error: false,
          });
          setTimeout(() => this.setState({ loading: false }), 100);
        })
        .catch((error) => {
          // console.log(error);
          if (this.state.errorCount < 3) {
            this.setState({ errorCount: this.state.errorCount + 1 });
            this.loadGallery();
          } else {
            this.setState({ loading: false, bottomLoader: false, error: true });
          }
        });
    }
  }
  loadMore() {
    if (this.getCameraRollPermissions()) {
      MediaLibrary.getAssetsAsync({
        first: 100,
        after: this.state.cursor,
        mediaType: ["photo", "video"],
        sortBy: ["modificationTime"],
      })
        .then((res) => {
          // console.log(res);
          this.setState({
            data: [...this.state.data, ...res.assets],
            cursor: res.endCursor,
            nextPage: res.hasNextPage,
            bottomLoader: false,
            error: false,
            errorCount: 0,
          });
          setTimeout(() => this.setState({ loading: false }), 100);
        })
        .catch((error) => {
          if (this.state.errorCount < 3) {
            this.setState({ errorCount: this.state.errorCount + 1 });
            this.loadMore();
          } else {
            this.setState({ loading: false, bottomLoader: false, error: true });
          }
        });
    }
  }
  componentDidUpdate() {
    if (this.state.selected.length > 15) {
      ToastAndroid.show("Only 15 allowed in One Mopic!", ToastAndroid.LONG);
    }
  }
  shouldComponentUpdate(p, s) {
    if (
      s.loading != this.state.loading ||
      s.bottomLoader != this.state.bottomLoader
    )
      return true;
    return false;
  }
  nextBt = new Animated.Value(100);
  render() {
    const isCloseToBottom = ({
      layoutMeasurement,
      contentOffset,
      contentSize,
    }) => {
      const paddingToBottom = 20;
      return (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      );
    };
    return (
      <View>
        <Layout
          style={{
            width: "100%",
            height: 50 + StatusBar.currentHeight,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            elevation: 1,
            paddingTop: StatusBar.currentHeight,
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
                Gallery
              </Text>
            </Layout>
          </Layout>
          <Animated.View style={{ transform: [{ translateX: this.nextBt }] }}>
            <Ripple
              style={{ padding: 10 }}
              onPress={() => {
                if (this.props.route.params?.type === "NEW_MOPIC") {
                  this.props.navigation.navigate("PostEditorScreen", {
                    images: this.state.selected,
                  });
                } else {
                  this.props.navigation.navigate("ImageEditor", {
                    ...this.props?.route?.params,
                    images: this.state.selected,
                  });
                }
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Text style={{ fontSize: 18, marginTop: -3 }}>Next</Text>
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
          </Animated.View>
        </Layout>

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
            data={[0, 1]}
            onScroll={(e) => {
              if (isCloseToBottom(e.nativeEvent)) {
                if (!this.state.bottomLoader && this.state.nextPage) {
                  this.loadMore();
                  this.setState({ bottomLoader: true });
                }
              }
            }}
            renderItem={({ index }) =>
              index === 0 ? (
                <GalleryList
                  key={index}
                  data={this.state.data}
                  onSelect={this.select.bind(this)}
                  onUnselect={this.unselect.bind(this)}
                />
              ) : this.state.error ? (
                <Text>Failed To Load Gallery!{"\n"}Please Try again!</Text>
              ) : this.state.bottomLoader ? (
                <Layout
                  key={index}
                  style={{
                    alignItems: "center",
                    height: 100,
                    width: Dimensions.get("screen").width,
                    backgroundColor: "transparent",
                    paddingTop: 10,
                  }}>
                  <Spinner />
                </Layout>
              ) : (
                <Layout key={index} style={{ height: 100 }} />
              )
            }
          />
        )}
      </View>
    );
  }
}
class GalleryList extends Component {
  shouldComponentUpdate(p, s) {
    if (p.data.length !== this.props.data.length) return true;
    return false;
  }
  render() {
    return (
      <FlatList
        data={this.props.data}
        extraData={this.props.data}
        numColumns={4}
        initialNumToRender={50}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => item.id}
        renderItem={({ item, index }) => (
          <GalleryImage
            key={index}
            item={item}
            onSelect={this.props.onSelect}
            onUnselect={this.props.onUnselect}
          />
        )}
      />
    );
  }
}
