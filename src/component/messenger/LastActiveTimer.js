import { Text } from "@ui-kitten/components";
import React, { Component } from "react";
import timeSince from "../utils/TimeSince";
export default class LastActiveTimer extends Component {
  state = {
    timer: this.props.time,
    lastActive: timeSince(this.props.time),
  };
  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({ lastActive: timeSince(this.props.time) });
    }, 60000);
  }
  componentDidUpdate() {
    if (this.props.time != this.state.timer) {
      clearInterval(this.timer);
      this.setState({
        timer: this.props.time,
        lastActive: timeSince(this.props.time),
      });
      this.timer = setInterval(() => {
        this.setState({ lastActive: timeSince(this.props.time) });
      }, 60000);
    }
  }
  render() {
    // console.log(this.props);
    return (
      <Text
        style={{
          marginLeft: 10,
          marginTop: 0,
          fontSize: 12,
          color: this.props.color ? this.props.color : "#e9e9e9",
        }}
        appearance="hint">
        {typeof this.state?.lastActive === "string"
          ? this.state.lastActive.includes("secs")
            ? "just now"
            : this.state.lastActive + ""
          : ""}
      </Text>
    );
  }
}
