const { Component } = require("react");
import React from "react";
import { Layout, Divider, Text } from "@ui-kitten/components";
import { Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
class Footer extends Component {
  render() {
    return (
      <Layout style={{ backgroundColor: "transparent" }}>
        <Layout style={{ padding: 10, backgroundColor: "transparent" }}>
          <Divider />
        </Layout>
        <Layout
          style={{
            padding: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "transparent",
            }}>
            <Image
              source={require("../../../assets/logo.png")}
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
            />
            <Image
              source={require("../../../assets/brandName.png")}
              resizeMode="contain"
              style={{ width: 100, height: 100 }}
            />
          </Layout>
          <Text appearance="hint" style={{ marginTop: 0 }}>
            <AntDesign name="copyright" size={15} color="#666" /> 2020
          </Text>
        </Layout>
      </Layout>
    );
  }
}
export default Footer;
