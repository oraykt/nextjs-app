interface Props {
  movieId: string;
}

export const MovieViewById = (props: Props) => {
  return <div>Movie ID: {props.movieId}</div>;
};
