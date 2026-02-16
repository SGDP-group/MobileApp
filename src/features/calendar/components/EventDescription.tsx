import React from "react";
import { View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";
import { styles } from "../styles/calendar.styles";

interface EventDescriptionProps {
  html: string;
  showFull?: boolean;
}

export default function EventDescription({ html, showFull = false }: EventDescriptionProps) {
  const { width } = useWindowDimensions();

  return (
    <View
      style={[
        styles.descriptionContainer,
        !showFull && { maxHeight: 44, overflow: "hidden" },
        { maxWidth: "100%" },
      ]}
    >
      <RenderHtml
        contentWidth={width - 40}
        source={{ html }}
        tagsStyles={{
          body: {
            color: "#666",
            fontSize: 14,
            lineHeight: 20,
          },
          p: {
            color: "#666",
            fontSize: 14,
            lineHeight: 20,
            marginVertical: 0,
          },
          strong: {
            fontWeight: "bold",
            color: "#333",
          },
          em: {
            fontStyle: "italic",
            color: "#666",
          },
          a: {
            color: "#007AFF",
            textDecorationLine: "underline",
          },
        }}
      />
    </View>
  );
}
