export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === "ADMIN";
};

export const isMember = () => {
  const user = getUser();
  return user?.role === "MEMBER";
};

export const isTrainer = () => {
  const user = getUser();
  return user?.role === "TRAINER";
};