import { StyleSheet } from 'react-native';

export const clipboardEditScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipsContainer: {
    marginBottom: 12,
  },
  chipsContent: {
    paddingRight: 16,
    gap: 8,
  },
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
    borderRadius: 12,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  newCategoryInputContainer: {
    flex: 1,
  },
  newCategoryInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  favoriteText: {
    fontSize: 16,
    marginLeft: 12,
  },
  saveButton: {
    marginTop: 24,
  },
  contentContainer: {
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Style for the small info icon button next to the "Content" label
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
});

