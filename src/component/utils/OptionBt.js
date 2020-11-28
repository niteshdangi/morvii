import React from "react";
import { Dimensions, Image } from "react-native";
import { Layout, Text, Icon } from "@ui-kitten/components";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Ripple from "react-native-material-ripple";

export default class OptionBt extends React.Component {
  state = { pressed: false };

  render() {
    const { props } = this;
    return (
      <Ripple
        onPress={() => {
          props.onPress ? props.onPress() : null;
        }}
        style={{
          padding: 10,
          width: Dimensions.get("window").width,
          backgroundColor: this.state.pressed ? "#e9e9e9" : "transparent",
        }}>
        <Layout
          style={{
            backgroundColor: "transparent",
            flexDirection: "row",
          }}>
          {props.icon ? (
            <Icon
              name={props.icon}
              style={{
                width: 25,
                height: 25,
                tintColor: props.color ? props.color : "#555",
                marginRight: 20,
              }}
            />
          ) : props.image ? (
            <Image
              source={props.image}
              style={{
                width: 25,
                height: 25,
                marginRight: 20,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: props.color ? props.color : "#555",
              }}
              resizeMode="cover"
            />
          ) : null}
          <Text
            category="h6"
            style={{ color: props.color ? props.color : "#000" }}>
            {props.text}
          </Text>
        </Layout>
      </Ripple>
    );
  }
}
