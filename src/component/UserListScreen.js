import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Layout, Icon, Text, Spinner } from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ScrollView, StatusBar } from "react-native";
import UserObj from "./profile/UserObj";
class UserListScreen extends Component {
  state = { loading: true };
  componentDidMount() {
    this.props.route.params?.data(this);
  }
  render() {
    return (
      <SafeAreaView>
        <Layout
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            elevation: 1,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Ripple
              style={{ padding: 10 }}
              onPress={() => this.props.navigation.goBack()}>
              <Icon
                name="arrow-back-outline"
                style={{
                  width: 27,
                  height: 27,
                  tintColor: "black",
                }}
              />
            </Ripple>
            <Text style={{ fontSize: 18, padding: 10 }}>
              {this.props.route?.params?.header}
            </Text>
          </Layout>
        </Layout>
        {this.state.loading ? (
          <Layout
            style={{
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}>
            <Spinner />
          </Layout>
        ) : (
          <ScrollView>
            {this.state.ratings?.map((item, index) => (
              <UserObj
                key={index}
                item={item.user}
                rating={item.rating}
                token={this.state.auth.token}
                username={this.state.auth.user.username}
              />
            ))}
            {this.state.data?.map((item, index) => (
              <UserObj
                key={index}
                item={item}
                token={this.state.auth.token}
                username={this.state.auth.user.username}
              />
            ))}
            <Layout style={{ height: 70, backgroundColor: "transparent" }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}
export default UserListScreen;
