import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/theme';

const SearchBar = ({ value, onChangeText, onPress, placeholder, editable = true, autoFocus }) => {
  const content = (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={COLORS.gray400} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search for brands, products...'}
        placeholderTextColor={COLORS.gray400}
        editable={editable}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText?.('')}>
          <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity>
          <Ionicons name="mic" size={20} color={COLORS.gray400} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress && !editable) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    height: SIZES.height.input,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: SIZES.font.md,
    color: COLORS.textPrimary,
    marginHorizontal: SIZES.sm,
  },
});

export default SearchBar;
