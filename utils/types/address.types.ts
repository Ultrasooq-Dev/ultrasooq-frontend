export interface AddressItem {
  id: number;
  firstName: string;
  lastName: string;
  cc: string;
  phoneNumber: string;
  address: string;
  town: string;
  cityDetail?: { id: number; name: string; };
  stateDetail?: { id: number; name: string; };
  countryDetail?: { id: number; name: string; };
  postCode: string;
}

export interface AddressCreateRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  cc: string;
  address: string;
  countryId: string | number;
  stateId: string | number;
  cityId: string | number;
  town: string;
  postCode: string;
}

export interface AddressUpdateRequest extends AddressCreateRequest {
  userAddressId: number;
}
