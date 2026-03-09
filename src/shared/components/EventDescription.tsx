import { colors } from "@/src/shared/theme/colors";
import { styles } from "@shared/styles/EventDescription.styles";
import React from "react";
import { View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

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
            color: colors.text,
            fontSize: 14,
            lineHeight: 20,
          },
          p: {
            color: colors.text,
            fontSize: 14,
            lineHeight: 20,
            marginVertical: 0,
          },
          strong: {
            fontWeight: "bold",
            color: colors.text,
          },
          em: {
            fontStyle: "italic",
            color: colors.secondary,
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
