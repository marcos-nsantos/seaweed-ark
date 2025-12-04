export class FolderNotEmptyError extends Error {
  constructor(message = 'Folder is not empty') {
    super(message);
    this.name = 'FolderNotEmpty';
  }
}
