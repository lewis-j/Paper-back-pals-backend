import { PopulateOptions } from 'mongoose';

export const bookRequestPopulateOptions: PopulateOptions = {
  path: 'userBook',
  populate: [
    { path: 'book' },
    { path: 'owner', select: 'username profilePic' },
  ],
  select: 'book owner',
};

export const transformBookRequest = (request: any) => {
  const { _id, userBook, status, currentPage, dueDate } = request;
  return {
    _id: userBook._id,
    book: userBook.book,
    owner: userBook.owner,
    request: { status, request_id: _id.toString() },
    currentPage,
    dueDate,
  };
};
