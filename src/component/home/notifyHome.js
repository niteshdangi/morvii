import React from "react";
import { Text, Button, Layout } from "@ui-kitten/components";
import { connect } from "react-redux";
import { Image } from "react-native";

const HomeNotifyView = ({ onPress }) => {
  return (
    <Layout
      level="2"
      style={{
        alignItems: "center",
        minHeight: 65,
      }}>
      <Image
        source={require("../../../assets/logobg.png")}
        style={{ width: 65, height: 65, borderRadius: 50 }}
      />
      <Text category="h6">Update your Profile!</Text>

      <Layout
        style={{
          flexWrap: "wrap",
          flexDirection: "row",
          marginTop: 10,
          marginBottom: 10,
        }}>
        <Button size="small" style={{ width: "45%", marginRight: "1%" }}>
          Update
        </Button>
        <Button
          onPress={onPress}
          size="small"
          appearance="outline"
          style={{ width: "48%" }}>
          Not Now
        </Button>
      </Layout>
    </Layout>
  );
};

const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, null)(HomeNotifyView);
