export type ReactElement = {
  $$typeof: Symbol;
  type: any;
  key: any;
  ref: any;
  props: any;

  _owner: any;
};
export type ReactFragment = ReactEmpty | Iterable<ReactNode>;
export type ReactText = string | number;
export type ReactNode = ReactElement | ReactText | ReactFragment;
export type ReactEmpty = null | void | boolean;
export type ReactNodeList = ReactEmpty | ReactNode;

export type ReactContext<T> = {
  $$typeof: symbol | number;
  _currentValue: T;

  Provider: ReactProviderType<T>;
  Consumer: ReactContext<T>;
};

export type ReactProviderType<T> = {
  $$typeof: symbol | number;
  _context: ReactContext<T>;
};
