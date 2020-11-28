/*
    This file is part of Morvii.

    Morvii is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Morvii is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Morvii.  If not, see <https://www.gnu.org/licenses/>.
*/
import React, { useEffect } from "react";
import * as eva from "@eva-design/eva";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { default as theme } from "./theme.json";
import AppNavigator from "./src/navigation/navigation";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store } from "./src/store";
import { default as mapping } from "./mapping.json";
import { Linking, StatusBar } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const store = require("./src/store").store;
  const notifee = require("@notifee/react-native");
  const Constants = require("./src/component/Constants");
  const Linking = require("react-native").Linking;
  if (
    remoteMessage.data.type === "receive_call" ||
    remoteMessage.data.type === "cancel_call"
  ) {
    if (store.getState().main.CallReducer.user) {
      this.props.setCallStatus({
        status: CallType.IDLE,
        user: null,
      });
    }
    if (data.type === "receive_call") {
      if (store.getState().main.CallReducer.status !== 0) {
        fetch(Constants.API_URL + "/messenger/call/" + data.user + "/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: "Token " + this.props.auth.token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ response: "BUSY" }),
        });
      } else {
        this.props.setCallStatus({
          status: CallType.INCOMING,
          user: {
            username: data.user,
            name: data.name,
            image: data.image,
          },
        });
        notifee.displayNotification({
          id: data.user + "_call",
          title: "Incoming Call",
          body: data.user,
          android: {
            channelId: "call",
            smallIcon: "ic_stat_name",
            color: "blue",
            sound: "default",
            onlyAlertOnce: true,
            colorized: true,
            pressAction: { id: "open_caller" },
            ongoing: true,
            largeIcon: data.image,
            actions: [
              {
                title: "Answer",
                pressAction: {
                  id: "answer_call",
                },
              },
              {
                title: "Reject",
                pressAction: {
                  id: "reject_call",
                },
              },
            ],
          },
        });
        Linking.openURL("morvii://VideoCall/" + data.user + "/RECEIVECALL");
      }
    }
  } else if (remoteMessage.data.type === "message") {
    var messages = [];
    var messages_ = JSON.parse(remoteMessage.data.message);
    messages_?.forEach((value, index) => {
      messages.push({
        text: value[1],
        timestamp: parseInt(value[0]),
        person: {
          name: remoteMessage.data.user ? remoteMessage.data.user : " ",
          icon: remoteMessage.data.icon,
        },
      });
    });
    fetch(Constants.API_URL + "/messenger/receive/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + store.getState().secure.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender: remoteMessage.data.user }),
    });
    notifee.default.displayNotification({
      id: remoteMessage.data.user,
      android: {
        channelId: "personal_message",
        smallIcon: "ic_stat_name",
        color: "blue",
        sound: "default",
        timestamp: Date.now(),
        showTimestamp: true,
        pressAction: { id: "open_messages", launchActivity: "default" },
        actions: [
          {
            title: "Reply",
            pressAction: {
              id: "reply",
            },
            input: {
              allowFreeFormInput: true,
              placeholder: "Reply to " + remoteMessage.data.user + "...",
            },
          },
          {
            title: "Mark as Read",
            pressAction: {
              id: "mark_as_read",
            },
          },
        ],
        style: {
          type: notifee.AndroidStyle.MESSAGING,
          group: true,
          title: remoteMessage.data.user,
          person: {
            icon: store.getState().secure.auth.user?.profile?.image + "",
            name: "You",
          },
          messages,
        },
      },
    });
  }
});
StatusBar.setTranslucent(true);
StatusBar.setBackgroundColor("transparent");
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  const store = require("./src/store").store;
  // console.log(store);
  const Constants = require("./src/component/Constants");
  // Check if the user pressed the "Mark as read" action
  if (type === EventType.PRESS && pressAction.id === "open_messages") {
    Linking.openURL("morvii://MessageScreen/" + notification.id);
  } else if (
    type === EventType.ACTION_PRESS &&
    pressAction.id === "mark_as_read"
  ) {
    fetch(Constants.API_URL + "/messenger/send/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + store.getState().secure.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender: detail.notification.id }),
    }).then(async (response) => {
      await notifee.cancelNotification(detail.notification.id);
    });
  } else if (type === EventType.ACTION_PRESS && pressAction.id === "reply") {
    fetch(Constants.API_URL + "/messenger/send/", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + store.getState().secure.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiver: detail.notification.id,
        message: detail.input,
      }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(async ([statusCode, data]) => {
        notifee.displayNotification({
          id: detail.notification.id,
          android: {
            ...detail.notification.android,
            timestamp: Date.now(),
            style: {
              ...detail.notification.android.style,
              messages: [
                ...detail.notification.android.style.messages,
                {
                  text: detail.input,
                  timestamp: Date.now(),
                },
              ],
            },
          },
        });
      })
      .catch(async () => {
        notifee.displayNotification({
          id: detail.notification.id,
          android: {
            ...detail.notification.android,
            timestamp: Date.now(),
            style: {
              ...detail.notification.android.style,
              messages: [
                ...detail.notification.android.style.messages,
                {
                  text:
                    detail.input +
                    "<small style='color:#444444;'> Failed!</small>",
                  timestamp: Date.now(),
                },
              ],
            },
          },
        });
      });
  } else if (
    type === EventType.ACTION_PRESS &&
    pressAction.id === "cancel_mopic_upload"
  ) {
    store.getState().main.UploadMopic.mopics?.[notification.id]?.abort();
  }
});
export default () => {
  return (
    <Provider store={store}>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider
        {...eva}
        theme={{ ...eva.light, ...theme }}
        customMapping={mapping}>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </ApplicationProvider>
    </Provider>
  );
};
