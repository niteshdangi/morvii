import React, { Component } from "react";
import { View, Image, FlatList, Animated } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as Permissions from "expo-permissions";
import { Text, Layout } from "@ui-kitten/components";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

export default class CameraRollHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
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
    if (this.getCameraRollPermissions()) {
      MediaLibrary.getAssetsAsync({
        first: 10,
        assetType: "Photos",
      })
        .then((res) => {
          if (res.assets[0].modificationTime > this.props.lstamp) {
            this.props.setRollTimestamp(res.assets[0].modificationTime);
            this.setState({
              data: res.assets,
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  render() {
    if (!this.state.data || this.state.data.length == 0) {
      return <></>;
    } else {
      return (
        <Animated.View style={this.props.animatedStyle}>
          <Layout
            style={{
              margin: 10,
              padding: 10,
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: "#e9e9e9",
            }}>
            <Text numberOfLines={1}>We Found Some New Images:</Text>
            <View>
              <FlatList
                data={this.state.data}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={{ minHeight: 70 }}
                renderItem={({ item, index }) => (
                  <TouchableWithoutFeedback
                    key={index}
                    onPress={() =>
                      this.props.navigation.navigate("PostEditorScreen", {
                        images: [item],
                      })
                    }
                    style={{
                      borderRadius: 100,
                      borderWidth: 2,
                      borderColor: "black",
                      padding: 2,
                      margin: 2.5,
                    }}>
                    <Image
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 100,
                        borderWidth: 2,
                        borderColor: "transparent",
                      }}
                      resizeMode="cover"
                      source={{ uri: item.uri }}
                    />
                  </TouchableWithoutFeedback>
                )}
              />
            </View>
          </Layout>
        </Animated.View>
      );
    }
  }
}
