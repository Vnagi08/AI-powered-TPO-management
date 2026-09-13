import { Application, Job, StudentProfile } from "@tpo/db";

const FUNNEL_STAGES = ["applied", "screening", "shortlisted", "interview", "offered"] as const;

export async function getPlacementStats() {
  const totalStudents = await StudentProfile.countDocuments();
  const placedStudents = await StudentProfile.countDocuments({ placementStatus: "placed" });
  const totalApplications = await Application.countDocuments();

  const byDepartmentRaw = await StudentProfile.aggregate([
    {
      $group: {
        _id: "$department",
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $eq: ["$placementStatus", "placed"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDepartment = byDepartmentRaw.map((d) => ({
    department: d._id as string,
    total: d.total as number,
    placed: d.placed as number,
    placementPercentage: d.total === 0 ? 0 : Math.round((d.placed / d.total) * 100),
  }));

  return {
    totalStudents,
    placedStudents,
    placementPercentage: totalStudents === 0 ? 0 : Math.round((placedStudents / totalStudents) * 100),
    totalApplications,
    byDepartment,
  };
}

export async function getRecruiterFunnel(recruiterUserId: string) {
  const jobs = await Job.find({ postedBy: recruiterUserId }).select("_id");
  const jobIds = jobs.map((j) => j._id);

  const counts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const countByStatus = new Map(counts.map((c) => [c._id as string, c.count as number]));

  return FUNNEL_STAGES.map((stage) => ({ stage, count: countByStatus.get(stage) ?? 0 }));
}

export async function getDepartmentStats(department: string) {
  const students = await StudentProfile.find({ department });
  const total = students.length;
  const placed = students.filter((s) => s.get("placementStatus") === "placed").length;
  const studentIds = students.map((s) => s._id);
  const totalApplications = await Application.countDocuments({ studentId: { $in: studentIds } });

  return {
    department,
    totalStudents: total,
    placedStudents: placed,
    placementPercentage: total === 0 ? 0 : Math.round((placed / total) * 100),
    totalApplications,
  };
}
