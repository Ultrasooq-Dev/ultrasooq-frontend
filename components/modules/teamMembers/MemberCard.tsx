import React from "react";
import Image from "next/image";
import TeamIcon from "@/public/images/team.png";
import ReviewDotIcon from "@/public/images/review-dot.svg";

const MemberCard = () => {
  return (
    <tr>
      <td data-th="name">
        <div className="team_user">
          <div className="team_user_pic">
            <Image src={TeamIcon} alt="team-user" />
          </div>
          <div className="team_user_name">
            <span>John Doe</span>
          </div>
        </div>
      </td>
      <td data-th="Email">JohnDoe15@gmail.com</td>
      <td data-th="Role">DESIGNER</td>
      <td data-th="Employee ID">EMP47890</td>
      <td data-th="Account Status">
        <span className="status">Active</span>
      </td>
      <td data-th="Action">
        <Image src={ReviewDotIcon} alt="review-dot" />
      </td>
    </tr>
  );
};

export default MemberCard;
