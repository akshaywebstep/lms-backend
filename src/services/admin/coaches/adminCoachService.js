
const {
  User,
  UserProfile,
  Course,
  Enrollment,
  Payment,
} = require("../../../models");
const { hashPassword } = require("../../../utils/password");
const { makeId } = require("../../../utils/id");
const { ROLES } = require("../../../config/constants");
const { env, sequelize } = require("../../../config/db");
const { sendMail } = require("../../mail");
const { toPublicUser, cleanEmail } = require("../../../utils/userHelper");
const { Op } = require("sequelize");

exports.getAllCoaches = async () => {
  try {
    const coaches = await User.findAll({
      where: { role: "coach" },
      include: [
        { model: UserProfile, as: "profile" },
        {
          model: Course,
          as: "coachedCourses",
          attributes: ["id", "title", "price", "status"],
        },
        {
          model: Enrollment,
          as: "coachEnrollments",
          attributes: ["id", "student_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = await Promise.all(
      coaches.map(async (c) => {
        const plain = toPublicUser(c);
        const courseCount = (c.coachedCourses || []).length;
        const studentCount = new Set(
          (c.coachEnrollments || []).map((e) => e.student_id),
        ).size;
        const revenue = await Payment.sum("amount", {
          where: {
            coach_id: c.id,
            status: { [Op.in]: ["completed", "success"] },
          },
        });

        return {
          ...plain,
          stats: {
            courses: courseCount,
            students: studentCount,
            revenue: Number(revenue || 0),
          },
        };
      }),
    );

    return {
      status: true,
      message: "Coaches fetched successfully.",
      data: { coaches: formatted },
    };
  } catch (error) {
    console.error("❌ Error in AdminCoachService.getAllCoaches:", error);
    return { status: false, message: error.message, data: null };
  }
};

exports.createCoach = async (body) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      title,
      bio,
      education,
      expertise,
      city,
      state,
      country,
    } = body;
    const clean = cleanEmail(email);

    const existing = await User.findOne({ where: { email: clean } });
    if (existing) {
      return {
        status: false,
        message: "Email is already registered.",
        data: null,
      };
    }

    const defaultPass = password || "password123";
    const hashed = hashPassword(defaultPass);
    const coachId = makeId("coach");

    await sequelize.transaction(async (t) => {
      await User.create(
        {
          id: coachId,
          name: String(name).trim(),
          email: clean,
          role: ROLES.COACH,
          title: title || "Coach",
          status: "active",
          password_hash: hashed.passwordHash,
          salt: hashed.salt,
        },
        { transaction: t },
      );

      await UserProfile.create(
        {
          user_id: coachId,
          phone: phone || null,
          bio: bio || null,
          education: education || null,
          expertise: expertise || null,
          city: city || null,
          state: state || null,
          country: country || "India",
        },
        { transaction: t },
      );
    });

    const createdCoach = await User.findOne({
      where: { id: coachId },
      include: [{ model: UserProfile, as: "profile" }],
    });

    await sendMail({
      module: "coach",
      action: "coach-welcome",
      to: clean,
      vars: {
        name: createdCoach.name,
        appName: env.appName,
        email: clean,
        password: defaultPass,
      },
    }).catch(() => {});

    return {
      status: true,
      message: "Coach created successfully.",
      data: { coach: toPublicUser(createdCoach), defaultPassword: defaultPass },
    };
  } catch (error) {
    console.error("❌ Error in AdminCoachService.createCoach:", error);
    return { status: false, message: error.message, data: null };
  }
};

exports.getCoachById = async (id) => {
  try {
    const coach = await User.findOne({
      where: { id, role: "coach" },
      include: [
        { model: UserProfile, as: "profile" },
        { model: Course, as: "coachedCourses" },
      ],
    });

    if (!coach)
      return { status: false, message: "Coach not found.", data: null };

    return {
      status: true,
      message: "Coach fetched successfully.",
      data: { coach: toPublicUser(coach) },
    };
  } catch (error) {
    console.error("❌ Error in AdminCoachService.getCoachById:", error);
    return { status: false, message: error.message, data: null };
  }
};

exports.updateCoach = async (id, body) => {
  try {
    const coach = await User.findOne({ where: { id, role: "coach" } });
    if (!coach)
      return { status: false, message: "Coach not found.", data: null };

    const userUpdates = {};
    if (body.name) userUpdates.name = body.name;
    if (body.email) userUpdates.email = cleanEmail(body.email);
    if (body.title) userUpdates.title = body.title;
    if (body.status) userUpdates.status = body.status;
    if (body.avatar || body.avatar_url)
      userUpdates.avatar_url = body.avatar || body.avatar_url;

    if (Object.keys(userUpdates).length > 0) {
      await User.update(userUpdates, { where: { id } });
    }

    const p = body.profile || body;
    await UserProfile.upsert({
      user_id: id,
      phone: p.phone,
      city: p.city,
      state: p.state,
      country: p.country,
      bio: p.bio,
      education: p.education,
      expertise: p.expertise,
    });

    const updated = await User.findOne({
      where: { id },
      include: [{ model: UserProfile, as: "profile" }],
    });

    return {
      status: true,
      message: "Coach updated successfully.",
      data: { coach: toPublicUser(updated) },
    };
  } catch (error) {
    console.error("❌ Error in AdminCoachService.updateCoach:", error);
    return { status: false, message: error.message, data: null };
  }
};

exports.deleteCoach = async (id) => {
  try {
    await User.destroy({ where: { id, role: "coach" } });
    return {
      status: true,
      message: "Coach deleted successfully.",
      data: { deleted: true, coachId: id },
    };
  } catch (error) {
    console.error("❌ Error in AdminCoachService.deleteCoach:", error);
    return { status: false, message: error.message, data: null };
  }
};

exports.updateCoachStatus = async (id, status) => {
  try {
    await User.update({ status }, { where: { id, role: "coach" } });
    const coach = await User.findByPk(id);
    return {
      status: true,
      message: "Coach status updated.",
      data: { coach: toPublicUser(coach) },
    };
  } catch (error) {
    console.error("❌ Error in AdminCoachService.updateCoachStatus:", error);
    return { status: false, message: error.message, data: null };
  }
};
