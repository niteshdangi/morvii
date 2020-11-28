import React, { Component } from "react";
import {
  StatusBar,
  Dimensions,
  Image,
  Animated,
  View,
  PanResponder,
} from "react-native";
import { Layout, Text, Button, Icon } from "@ui-kitten/components";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import PinchableBox from "./PinchableImage";

export default class HomeMedia extends Component {
  state = {
    scrollX: new Animated.Value(0),
    mopics: [...this.props?.data],
    loading: true,
  };
  scrollOffset = 0;
  constructor(props) {
    super(props);
    this.pagination = [...this.props.data.map(() => React.createRef())];
  }
  componentDidUpdate() {
    if (this.props.data !== this.state.mopics) {
      this.setState({ mopics: this.props.data });
    }
  }
  componentDidMount() {
    // if (this.props.data) {
    //   this.setState({
    //     mopics: [...this.props.data],
    //   });
    // } else {
    //   //   this.props.navigation.goBack();
    // }
    this.state.scrollX.addListener(({ value }) => {
      const index = Math.round(value / Dimensions.get("screen").width);
      this.pagination[index]?.current?.setNativeProps({
        backgroundColor: "red",
        transform: [{ scale: 1.2 }],
      });
      for (let i = 0; i < this.pagination.length; i++) {
        if (index === i) continue;
        else {
          try {
            if ((i > index - 3 && i < index) || (i < index + 3 && i > index))
              this.pagination[i].current.setNativeProps({
                backgroundColor: "blue",
                transform: [{ scale: 0.9 }],
              });
            else
              this.pagination[i].current.setNativeProps({
                backgroundColor: "blue",
                transform: [{ scale: 0.5 }],
              });
          } catch (e) {}
        }
      }
      // console.log(this.pagination[index]);
    });
  }
  onScrollEnd = (e) => {
    if (this.state.mopics.length <= 1) return false;
    const { contentOffset, velocity } = e.nativeEvent;

    var screenWidth = Dimensions.get("screen").width;
    var moved =
      contentOffset.x > screenWidth
        ? contentOffset.x - screenWidth
        : contentOffset.x;
    while (moved > screenWidth) {
      moved -= screenWidth;
    }
    if (contentOffset.x < this.scrollOffset) {
      moved -= screenWidth;
    }
    var newY = contentOffset.x - moved;
    if (moved < -60) {
      newY = contentOffset.x - moved - screenWidth;
    } else if (moved > 60) {
      newY = contentOffset.x - moved + screenWidth;
    } else {
      newY = contentOffset.x - moved;
    }
    this?.list?.scrollTo({ x: newY, y: 0, animated: true });
    this.scrollOffset = newY;
  };
  getStyle = (index) => {
    return {
      transform: [
        {
          scale: this.state.scrollX.interpolate({
            inputRange: [
              -(index * Dimensions.get("screen").width) - 10,
              index === 0
                ? 0
                : index - 1 === 0
                ? Dimensions.get("screen").width
                : index * Dimensions.get("screen").width,
              index === 0
                ? Dimensions.get("screen").width
                : (index + 1) * Dimensions.get("screen").width,
            ],
            outputRange: [0, 1, 0.5],
            extrapolate: "clamp",
            useNativeDriver: true,
          }),
        },
        {
          translateX: this.state.scrollX.interpolate({
            inputRange: [
              -(index * Dimensions.get("screen").width) - 10,
              index === 0
                ? 0
                : index - 1 === 0
                ? Dimensions.get("screen").width
                : index * Dimensions.get("screen").width,
              index === 0
                ? Dimensions.get("screen").width
                : (index + 1) * Dimensions.get("screen").width,
            ],
            outputRange: [
              -Dimensions.get("screen").width / 2,
              0,
              Dimensions.get("screen").width / 2,
            ],
            extrapolate: "clamp",
            useNativeDriver: true,
          }),
        },
      ],
    };
  };
  render() {
    return (
      <View>
        <ScrollView
          style={{ backgroundColor: "transparent" }}
          showsVerticalScrollIndicator={false}
          ref={(ref) => {
            this.list = ref;
          }}
          onScroll={(e) => {
            Animated.event(
              [
                {
                  nativeEvent: { contentOffset: { x: this.state.scrollX } },
                },
              ],
              { useNativeDriver: false }
            )(e);
          }}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          snapToInterval={Dimensions.get("screen").width}
          scrollEnabled={this.state.mopics.length > 1}
          onScrollEndDrag={this.onScrollEnd}>
          {this.state?.mopics?.map((item, index) => (
            <Animated.View key={index} style={{ ...this.getStyle(index) }}>
              <Layout
                style={{
                  borderRadius: 30,
                  overflow: "hidden",
                  marginHorizontal: 15,
                  elevation: 10,
                  marginTop: 5,
                  marginBottom: 20,
                  width: Dimensions.get("screen").width - 30,
                }}>
                <PinchableBox
                  navigation={this.props.navigation}
                  doubleTap={this.props.onLike}
                  media={item}
                />
              </Layout>
            </Animated.View>
          ))}
        </ScrollView>
        <Layout
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}>
          {this.state?.mopics.length > 1 &&
            this.state?.mopics.map((i, index) => {
              return (
                <Animated.View
                  key={index}
                  ref={this.pagination[index]}
                  style={{
                    height: 5,
                    width: 5,
                    borderRadius: 5,
                    backgroundColor: index == 0 ? "red" : "blue",
                    margin: 2.5,
                    transform: [{ scale: index == 0 ? 1.2 : 0.9 }],
                  }}
                />
              );
            })}
        </Layout>
      </View>
    );
  }
}
