import { redirect } from "next/navigation";
import React from "react";

const SettingsPage = () => {
  redirect("/my-settings/address");
};

export default SettingsPage;
