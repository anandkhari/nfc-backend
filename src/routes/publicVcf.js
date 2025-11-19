const express = require("express");
const Profile = require("../models/profile-model"); // adjust path if needed

const router = express.Router();

router.get("/vcf/:id", async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).send("Profile not found");
    }

    const [firstName, ...rest] = (profile.name || "").split(" ");
    const lastName = rest.join(" ");

    // Build VCF
    let vcf = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName}
FN:${profile.name}
`;

    if (profile.company) vcf += `ORG:${profile.company}\n`;
    if (profile.jobTitle) vcf += `TITLE:${profile.jobTitle}\n`;

    profile.phones?.forEach((p) => {
      vcf += `TEL;TYPE=${(p.type || "WORK").toUpperCase()}:${p.number}\n`;
    });

    profile.emails?.forEach((e) => {
      vcf += `EMAIL;TYPE=${(e.type || "WORK").toUpperCase()}:${e.address}\n`;
    });

    vcf += "END:VCARD";

    // Correct headers to open native Contact UI
    res.set({
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${profile.name}.vcf"`,
    });

    return res.send(vcf);
  } catch (err) {
    console.error("❌ Error generating VCF:", err);
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
