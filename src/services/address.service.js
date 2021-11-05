import http from "../http-common";

class AddressDataService {
  getAll() {
    return http.get("/address");
  }

  create(data) {
    return http.post("/address", data);
  }
}

export default new AddressDataService();