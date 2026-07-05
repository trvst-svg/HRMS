import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  checkInGps,
  getContracts,
  issueContract,
  signContract,
  getOkrs,
  createOkr,
  updateOkrProgress,
  getJobPostings,
  createJobPosting,
  getJobApplications,
  updateApplicationStatus,
  getShifts,
  assignShift,
} from "../../api/saasApi";
import { getEmployees } from "../../api/employeeApi";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import {
  FileText,
  MapPin,
  Target,
  Briefcase,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  UserCheck,
  Award,
} from "lucide-react";

export default function SaaSWorkspace() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);

  // Shared Data
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState(
    role === "employee" ? "gps" : "ats",
  );

  // Form states
  const [contractEmp, setContractEmp] = useState("");
  const [contractTitle, setContractTitle] = useState("");
  const [contractContent, setContractContent] = useState("");
  const [submittingContract, setSubmittingContract] = useState(false);

  const [okrEmp, setOkrEmp] = useState("");
  const [okrObjective, setOkrObjective] = useState("");
  const [okrKeyResults, setOkrKeyResults] = useState("");
  const [okrTarget, setOkrTarget] = useState("");
  const [submittingOkr, setSubmittingOkr] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobDept, setJobDept] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [postToLinkedIn, setPostToLinkedIn] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [linkedInResult, setLinkedInResult] = useState(null);

  const [shiftEmp, setShiftEmp] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");
  const [submittingShift, setSubmittingShift] = useState(false);

  // Employee actions states
  const [gpsLoading, setGpsLoading] = useState(false);
  const [signatureText, setSignatureText] = useState({});
  const [signingId, setSigningId] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const promises = [
        getContracts(),
        getOkrs(),
        getJobPostings(),
        getShifts(),
      ];

      if (role === "admin" || role === "manager") {
        promises.push(getEmployees());
        promises.push(getJobApplications());
      }

      const results = await Promise.all(promises);
      setContracts(results[0].data.data || []);
      setOkrs(results[1].data.data || []);
      setJobs(results[2].data.data || []);
      setShifts(results[3].data.data || []);

      if (role === "admin" || role === "manager") {
        setEmployees(results[4].data.data || []);
        setApplications(results[5].data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [role]);

  // GPS Check-In
  const handleGpsCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await checkInGps(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          toast.success(res.data.message || "GPS check-in logged present!");
          loadAllData();
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
              "Check-in failed. Out of geofence coordinates.",
          );
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        toast.error("Unable to retrieve your location coordinates.");
        setGpsLoading(false);
      },
    );
  };

  // Issue Contract
  const handleIssueContract = async (e) => {
    e.preventDefault();
    if (!contractEmp || !contractTitle || !contractContent) return;
    try {
      setSubmittingContract(true);
      await issueContract({
        employeeId: contractEmp,
        title: contractTitle,
        content: contractContent,
      });
      toast.success("Contract issued to employee.");
      setContractEmp("");
      setContractTitle("");
      setContractContent("");
      loadAllData();
    } catch (err) {
      toast.error("Failed to issue contract.");
    } finally {
      setSubmittingContract(false);
    }
  };

  // Sign Contract
  const handleSignContract = async (id) => {
    const sig = signatureText[id];
    if (!sig) {
      toast.error("Please enter your signature text/acknowledgment.");
      return;
    }
    try {
      setSigningId(id);
      await signContract(id, sig);
      toast.success("Contract digitally signed and filed!");
      loadAllData();
    } catch (err) {
      toast.error("Signing failed.");
    } finally {
      setSigningId(null);
    }
  };

  // Create OKR
  const handleCreateOkr = async (e) => {
    e.preventDefault();
    if (!okrEmp || !okrObjective || !okrKeyResults || !okrTarget) return;
    try {
      setSubmittingOkr(true);
      await createOkr({
        employeeId: okrEmp,
        objective: okrObjective,
        keyResults: okrKeyResults,
        targetDate: okrTarget,
      });
      toast.success("Performance OKR set.");
      setOkrEmp("");
      setOkrObjective("");
      setOkrKeyResults("");
      setOkrTarget("");
      loadAllData();
    } catch (err) {
      toast.error("Failed to create OKR.");
    } finally {
      setSubmittingOkr(false);
    }
  };

  // Update OKR Progress
  const handleUpdateOkrProgress = async (id, progress) => {
    try {
      await updateOkrProgress(id, progress);
      toast.success(`Progress logged at ${progress}%`);
      loadAllData();
    } catch (err) {
      toast.error("Failed to update progress.");
    }
  };

  // Create Job Posting
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc || !jobDept) return;
    try {
      setSubmittingJob(true);
      setLinkedInResult(null);
      const res = await createJobPosting({
        title: jobTitle,
        description: jobDesc,
        department: jobDept,
        location: jobLocation,
        postToLinkedIn,
      });
      toast.success("Job posting added to careers feed.");
      // Show LinkedIn result if we attempted to post
      if (postToLinkedIn) {
        const liRes = res.data?.linkedIn;
        if (liRes?.success) {
          setLinkedInResult({
            ok: true,
            message: `Posted to LinkedIn! Post ID: ${liRes.postId}`,
          });
        } else {
          setLinkedInResult({
            ok: false,
            message:
              liRes?.error || "LinkedIn posting failed — job saved internally.",
          });
        }
      }
      setJobTitle("");
      setJobDesc("");
      setJobDept("");
      setJobLocation("");
      setPostToLinkedIn(false);
      loadAllData();
    } catch (err) {
      toast.error("Failed to create posting.");
    } finally {
      setSubmittingJob(false);
    }
  };

  // Update Application Status
  const handleUpdateAppStatus = async (id, status) => {
    try {
      await updateApplicationStatus(id, status);
      toast.success(`Applicant moved to stage: ${status}`);
      loadAllData();
    } catch (err) {
      toast.error("Failed to transition candidate stage.");
    }
  };

  // Assign Shift
  const handleAssignShift = async (e) => {
    e.preventDefault();
    if (!shiftEmp || !shiftStart || !shiftEnd) return;
    try {
      setSubmittingShift(true);
      await assignShift({
        employeeId: shiftEmp,
        startTime: shiftStart,
        endTime: shiftEnd,
        notes: shiftNotes,
      });
      toast.success("Shift schedule logged successfully.");
      setShiftEmp("");
      setShiftStart("");
      setShiftEnd("");
      setShiftNotes("");
      loadAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to roster shift.");
    } finally {
      setSubmittingShift(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div
      className="animate-fade-in"
      style={{ paddingBottom: "var(--space-8)" }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "var(--space-4)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 800 }}>
            Toolbox
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
              marginTop: "4px",
            }}
          >
            GPS check-in, digital contracts, OKRs, hiring pipeline & shift
            scheduling.
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {role === "employee" ? (
            <>
              <Button
                variant={activeTab === "gps" ? "brand" : "ghost"}
                onClick={() => setActiveTab("gps")}
              >
                GPS Attendance
              </Button>
              <Button
                variant={activeTab === "contracts" ? "brand" : "ghost"}
                onClick={() => setActiveTab("contracts")}
              >
                My Contracts
              </Button>
              <Button
                variant={activeTab === "okrs" ? "brand" : "ghost"}
                onClick={() => setActiveTab("okrs")}
              >
                My OKRs
              </Button>
              <Button
                variant={activeTab === "shifts" ? "brand" : "ghost"}
                onClick={() => setActiveTab("shifts")}
              >
                My Roster
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={activeTab === "ats" ? "brand" : "ghost"}
                onClick={() => setActiveTab("ats")}
              >
                Recruiting (ATS)
              </Button>
              <Button
                variant={activeTab === "contracts" ? "brand" : "ghost"}
                onClick={() => setActiveTab("contracts")}
              >
                Contract Signing
              </Button>
              <Button
                variant={activeTab === "okrs" ? "brand" : "ghost"}
                onClick={() => setActiveTab("okrs")}
              >
                OKR Performance
              </Button>
              <Button
                variant={activeTab === "shifts" ? "brand" : "ghost"}
                onClick={() => setActiveTab("shifts")}
              >
                Shift Scheduling
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TABS CONTAINER */}

      {/* GPS Tab (Employee) */}
      {activeTab === "gps" && (
        <Card
          className="hover-lift"
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          <CardHeader style={{ textAlign: "center" }}>
            <CardTitle
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <MapPin size={22} /> Kathmandu Office HQ Geofenced Check-In
            </CardTitle>
          </CardHeader>
          <CardContent
            style={{
              padding: "var(--space-6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-base)",
              }}
            >
              Check-in is permitted only when your device coordinates fall
              within **200 meters** of Kathmandu Office HQ.
            </p>
            <div
              style={{
                padding: "16px",
                background: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                width: "100%",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  textTransform: "uppercase",
                  display: "block",
                  color: "var(--color-text-muted)",
                }}
              >
                Target Location
              </span>
              <strong style={{ fontSize: "var(--font-size-md)" }}>
                Kathmandu HQ (27.7172, 85.3240)
              </strong>
            </div>
            <Button
              variant="brand"
              onClick={handleGpsCheckIn}
              disabled={gpsLoading}
              style={{
                width: "100%",
                minHeight: "48px",
                fontSize: "var(--font-size-md)",
              }}
            >
              {gpsLoading
                ? "Retrieving coordinates..."
                : "Verify Location & Check-In"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contracts Tab */}
      {activeTab === "contracts" && (
        <div
          className={role === "admin" ? "grid-responsive-1-2" : ""}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--space-6)",
          }}
        >
          {role === "admin" && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Issue Employment Contract</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "var(--space-4)" }}>
                <form
                  onSubmit={handleIssueContract}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Employee
                    </label>
                    <select
                      value={contractEmp}
                      onChange={(e) => setContractEmp(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Contract Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Employment Agreement"
                      value={contractTitle}
                      onChange={(e) => setContractTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Agreement Specifications
                    </label>
                    <textarea
                      placeholder="Terms and responsibilities..."
                      value={contractContent}
                      onChange={(e) => setContractContent(e.target.value)}
                      style={{ minHeight: "120px" }}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={submittingContract}
                  >
                    {submittingContract ? "Issuing..." : "Issue Contract"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Contracts List */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Contracts Registry</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0" }}>
              {contracts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {contracts.map((con) => (
                    <div
                      key={con.id}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "250px" }}>
                        <h4 style={{ fontWeight: 700 }}>{con.title}</h4>
                        <p
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          Issued to:{" "}
                          {con.firstName
                            ? `${con.firstName} ${con.lastName}`
                            : "You"}
                        </p>
                        <div
                          style={{
                            margin: "12px 0",
                            padding: "12px",
                            background: "var(--color-bg-secondary)",
                            borderRadius: "var(--radius-md)",
                            whiteSpace: "pre-wrap",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          {con.content}
                        </div>
                        {con.status === "signed" && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            <span>
                              Signature Lock:{" "}
                              <strong>{con.signatureData}</strong>
                            </span>
                            <span>
                              Signed At:{" "}
                              {new Date(con.signedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {con.status === "signed" ? (
                          <span
                            style={{
                              color: "var(--color-success)",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle size={16} /> Signed
                          </span>
                        ) : role === "employee" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Type FULL NAME to sign"
                              value={signatureText[con.id] || ""}
                              onChange={(e) =>
                                setSignatureText({
                                  ...signatureText,
                                  [con.id]: e.target.value,
                                })
                              }
                            />
                            <Button
                              size="sm"
                              variant="brand"
                              onClick={() => handleSignContract(con.id)}
                              disabled={signingId === con.id}
                            >
                              Sign Digitally
                            </Button>
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "var(--color-warning)",
                              fontWeight: 700,
                            }}
                          >
                            Pending Sign
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    padding: "var(--space-6)",
                  }}
                >
                  No contracts registered.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* OKRs Tab */}
      {activeTab === "okrs" && (
        <div
          className={role !== "employee" ? "grid-responsive-1-2" : ""}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--space-6)",
          }}
        >
          {role !== "employee" && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Assign OKR Target</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "var(--space-4)" }}>
                <form
                  onSubmit={handleCreateOkr}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Assignee
                    </label>
                    <select
                      value={okrEmp}
                      onChange={(e) => setOkrEmp(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Objective
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Implement performance radar metrics"
                      value={okrObjective}
                      onChange={(e) => setOkrObjective(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Key Results
                    </label>
                    <textarea
                      placeholder="e.g. 1. Complete schema integrations"
                      value={okrKeyResults}
                      onChange={(e) => setOkrKeyResults(e.target.value)}
                      style={{ minHeight: "80px" }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={okrTarget}
                      onChange={(e) => setOkrTarget(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={submittingOkr}
                  >
                    Assign OKR
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* OKRs List */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Active OKRs Objectives</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0" }}>
              {okrs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {okrs.map((okr) => (
                    <div
                      key={okr.id}
                      style={{
                        padding: "20px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <h4 style={{ fontWeight: 800 }}>{okr.objective}</h4>
                        <span
                          style={{
                            fontSize: "var(--font-size-sm)",
                            fontWeight: 700,
                          }}
                        >
                          {okr.progress}% Completed
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Target: {new Date(okr.targetDate).toLocaleDateString()}{" "}
                        {okr.firstName &&
                          `· Employee: ${okr.firstName} ${okr.lastName}`}
                      </p>
                      <div
                        style={{
                          marginTop: "10px",
                          background: "var(--color-bg-secondary)",
                          padding: "10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "var(--font-size-xs)",
                        }}
                      >
                        <strong>Key Results:</strong> {okr.keyResults}
                      </div>

                      {/* Progress update controls for Employee */}
                      {role === "employee" && okr.status !== "completed" && (
                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Progress:
                          </span>
                          <select
                            value={okr.progress}
                            onChange={(e) =>
                              handleUpdateOkrProgress(
                                okr.id,
                                parseInt(e.target.value, 10),
                              )
                            }
                            style={{
                              width: "auto",
                              minHeight: "32px",
                              padding: "4px",
                            }}
                          >
                            {[0, 10, 25, 50, 75, 90, 100].map((v) => (
                              <option key={v} value={v}>
                                {v}%
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    padding: "var(--space-6)",
                  }}
                >
                  No OKR targets registered.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ATS Recruiting Tab */}
      {activeTab === "ats" && (
        <div
          className={role === "admin" ? "grid-responsive-1-2" : ""}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--space-6)",
          }}
        >
          {role === "admin" && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Post Job Opening</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "var(--space-4)" }}>
                <form
                  onSubmit={handleCreateJob}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lead React Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering"
                      value={jobDept}
                      onChange={(e) => setJobDept(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Job Description
                    </label>
                    <textarea
                      placeholder="Job specifications and details..."
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                      style={{ minHeight: "80px" }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Remote / Karachi, PK"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                    />
                  </div>

                  {/* LinkedIn posting toggle */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: "12px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      background: postToLinkedIn
                        ? "rgba(0,119,181,0.06)"
                        : "transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={postToLinkedIn}
                      onChange={(e) => setPostToLinkedIn(e.target.checked)}
                      style={{
                        width: 18,
                        height: 18,
                        cursor: "pointer",
                        accentColor: "#0077b5",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {/* LinkedIn blue icon */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="#0077b5"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--font-size-sm)",
                          }}
                        >
                          Post to LinkedIn
                        </span>
                        <p
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                            margin: 0,
                          }}
                        >
                          Share this opening on your company LinkedIn page
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* LinkedIn result banner */}
                  {linkedInResult && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        background: linkedInResult.ok
                          ? "rgba(0,180,100,0.08)"
                          : "rgba(220,60,60,0.08)",
                        border: `1px solid ${linkedInResult.ok ? "var(--color-success)" : "var(--color-danger)"}`,
                        fontSize: "var(--font-size-xs)",
                        color: linkedInResult.ok
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                        fontWeight: 600,
                      }}
                    >
                      {linkedInResult.message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="brand"
                    disabled={submittingJob}
                  >
                    {submittingJob
                      ? "Publishing..."
                      : postToLinkedIn
                        ? "📤 Publish & Post to LinkedIn"
                        : "Publish Opening"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Job Applications Kanban Roster */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Briefcase size={18} /> Candidate Pipelines (ATS)
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0" }}>
              {applications.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <h4 style={{ fontWeight: 800 }}>{app.name}</h4>
                        <p
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Applied for: <strong>{app.jobTitle}</strong> (
                          {app.department}) · {app.email}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 700,
                            borderRadius: "var(--radius-full)",
                            background:
                              app.status === "Hired"
                                ? "var(--color-success-ghost)"
                                : "var(--color-brand-ghost)",
                            color:
                              app.status === "Hired"
                                ? "var(--color-success)"
                                : "var(--color-text-primary)",
                          }}
                        >
                          {app.status}
                        </span>

                        {/* Status Pipeline adjustments */}
                        {app.status !== "Hired" &&
                          app.status !== "Rejected" && (
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleUpdateAppStatus(app.id, e.target.value)
                              }
                              style={{
                                width: "auto",
                                minHeight: "30px",
                                padding: "2px",
                                fontSize: "var(--font-size-xs)",
                              }}
                            >
                              <option value="Applied">Applied</option>
                              <option value="Screening">Screening</option>
                              <option value="Technical">Technical</option>
                              <option value="Offer">Offer</option>
                              <option value="Hired">Hired</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    padding: "var(--space-6)",
                  }}
                >
                  No candidate applications found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shifts Scheduling Tab */}
      {activeTab === "shifts" && (
        <div
          className={role !== "employee" ? "grid-responsive-1-2" : ""}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--space-6)",
          }}
        >
          {role !== "employee" && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Roster Shift Time</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "var(--space-4)" }}>
                <form
                  onSubmit={handleAssignShift}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Assignee
                    </label>
                    <select
                      value={shiftEmp}
                      onChange={(e) => setShiftEmp(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Shift Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Shift End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      Roster Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Shift tasks or floor assignment..."
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={submittingShift}
                  >
                    Assign Shift
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Shifts roster List */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Clock size={18} /> Roster Calendar
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0" }}>
              {shifts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {shifts.map((sh) => (
                    <div
                      key={sh.id}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h4 style={{ fontWeight: 800 }}>
                          {sh.firstName
                            ? `${sh.firstName} ${sh.lastName}`
                            : "Your Shift"}
                        </h4>
                        <p
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          Start: {new Date(sh.startTime).toLocaleString()} ·
                          End: {new Date(sh.endTime).toLocaleString()}
                        </p>
                        {sh.notes && (
                          <p
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-secondary)",
                              marginTop: "4px",
                            }}
                          >
                            Notes: "{sh.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    padding: "var(--space-6)",
                  }}
                >
                  No shifts rostered.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
