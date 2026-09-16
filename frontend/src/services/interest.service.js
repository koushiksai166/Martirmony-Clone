import api from "./api";

export const getSentInterests = () => api.get("/interests/sent");
export const getReceivedInterests = () => api.get("/interests/received");
export const acceptInterest = (id) => api.patch(`/interests/${id}/accept`);
export const rejectInterest = (id) => api.patch(`/interests/${id}/reject`);
export const withdrawInterest = (id) => api.delete(`/interests/${id}`);
export const sendInterest = (profileId) => api.post(`/interests/${profileId}`);
