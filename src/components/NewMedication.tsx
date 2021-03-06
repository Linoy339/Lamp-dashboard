// Core Imports
import React, { useEffect, useState, useRef } from "react"
import {
  Typography,
  makeStyles,
  Box,
  Grid,
  IconButton,
  TextField,
  Button,
  FormControl,
  Container,
  AppBar,
  Toolbar,
  Icon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  List,
  ListItem,
  Menu,
  ListItemText,
  MenuItem,
  Card,
  ButtonBase,
  InputBase,
} from "@material-ui/core"
import { DatePicker, TimePicker } from "@material-ui/pickers"
import classnames from "classnames"
import LAMP from "lamp-core"
import Autocomplete from "@material-ui/lab/Autocomplete"
import { useSnackbar } from "notistack"
import { useTranslation } from "react-i18next"

async function getAttachmentData(participantId, type: string) {
  return Object.fromEntries(
    (
      await Promise.all(
        [participantId || ""].map(async (x) => [x, await LAMP.Type.getAttachment(x, type).catch((e) => [])])
      )
    )
      .filter((x: any) => x[1].message !== "404.object-not-found")
      .map((x: any) => [x[0], x[1].data])
  )
}

export default function NewMedication({ participant, ...props }) {
  const classes = useStyles()
  const [open, setOpen] = useState(false)
  const [journalValue, setJounalValue] = useState("")
  const [status, setStatus] = useState("Yes")
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [medicationName, setMedicationName] = useState()
  const [date, changeDate] = useState(new Date())
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [duration, setDuration] = useState(0)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [reminderTime, setReminderTime] = useState(new Date())
  const [selectedFrequency, setSelectedFrequency] = useState("daily")
  const [selectedDays, setSelectedDays] = useState([])
  const [dosageList, setDosageList] = useState([])
  const [openAddDosage, setOpenAddDosage] = useState(false)
  const [dosageName, setDosageName] = useState(null)
  const [dosageValue, setDosageValue] = useState(null)
  const [dosageTime, setDosageTime] = useState(new Date())
  const [medications, setMedications] = useState({})
  const [feeds, setFeeds] = useState({})
  const { enqueueSnackbar } = useSnackbar()
  const nameInput = useRef(null)
  const doseNameInput = useRef(null)
  const doseValueInput = useRef(null)
  const { t } = useTranslation()
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const getDateString = (date: Date) => {
    var monthname = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return monthname[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear()
  }
  const frequency = ["daily", "weekly", "monthly"]

  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, index: any) => {
    setAnchorEl(null)
  }
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const setSelectedDaysValue = (val: any) => {
    var days = selectedDays
    if (days.indexOf(val) !== -1) {
      days = days.filter((item) => item !== val)
    } else {
      days = days.concat(val)
    }
    setSelectedDays(days)
  }
  const changeStartDate = (e: any) => {
    var date = new Date(e)
    setStartDate(date)
  }
  const changeEndDate = (e: any) => {
    let msDiff = new Date(e).getTime() - startDate.getTime()
    setEndDate(new Date(e))
    let daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24))
    setDuration(daysDiff)
  }

  const changeReminderTime = (e: any) => {
    var date = new Date(e)
    setReminderTime(date)
  }

  const changeDosageTime = (e: any) => {
    var date = new Date(e)
    setDosageTime(date)
  }
  const getDetails = (data) => {
    let x = (data || {})[participant.id || ""] || []
    return !Array.isArray(x) ? [] : x
  }

  function getTimeValue(date: Date) {
    var hours = date.getHours()
    var minute = date.getMinutes()
    var ampm = hours >= 12 ? " pm" : " am"
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    var minutes = minute < 10 ? "0" + minute : minute
    var strTime = hours + ":" + minutes + ampm
    return strTime
  }

  const saveNewMedication = async () => {
    if (validateNewMedication()) {
      let all = getDetails(medications)
      let medicationDetails = {
        medicationName: medicationName,
        frequency: selectedFrequency,
        weekdays: selectedDays,
        startDate: startDate,
        duration: duration,
        reminderTime: reminderTime,
        dosageList: dosageList,
      }
      all.push(medicationDetails)
      LAMP.Type.setAttachment(participant.id, "me", "lamp.medications", all)
      setMedications({ ...(medications || {}), [participant]: all })
      all = getDetails(feeds)
      let text = medicationName || "".substring(0, 20)
      if (text.length != medicationName || "".length) {
        text = text.substr(0, Math.min(text.length, text.lastIndexOf(" "))) + "..."
      }
      var item = {
        type: "medication",
        timeValue: reminderTime,
        title: t("Medication: ") + text,
        icon: "Medication",
        description: "test description",
        group: "manage",
        frequency: selectedFrequency,
        weekdays: selectedDays,
        startDate: startDate,
        endDate: endDate,
        completed: false,
      }
      all.push(item)
      LAMP.Type.setAttachment(participant.id, "me", "lamp.feed.medications", all)
      props.onComplete()
      enqueueSnackbar(t("The medication has been saved successfully."), {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        preventDuplicate: true,
      })
    }
  }

  const validateNewMedication = () => {
    if (medicationName != null && medicationName != "") {
      if (duration != null && duration != 0) {
        return true
      } else {
        enqueueSnackbar(t("Please select duration."), {
          variant: "error",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          preventDuplicate: true,
        })
      }
    } else {
      nameInput.current.focus()
      enqueueSnackbar(t("Please select medication name."), {
        variant: "error",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        preventDuplicate: true,
      })
    }
  }

  const validateDosage = () => {
    if (dosageName != null && dosageName != "") {
      if (dosageValue != null && dosageValue != "") {
        return true
      } else {
        doseValueInput.current.focus()
        enqueueSnackbar(t("Please enter dose."), {
          variant: "error",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
          preventDuplicate: true,
        })
      }
    } else {
      doseNameInput.current.focus()
      enqueueSnackbar(t("Please enter name."), {
        variant: "error",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
        preventDuplicate: true,
      })
    }
  }

  useEffect(() => {
    ;(async () => {
      let medications = await getAttachmentData(participant.id, "lamp.medications")
      setMedications(medications)
      let feeds = await getAttachmentData(participant.id, "lamp.feed.medications")
      setFeeds(feeds)
    })()
  }, [])

  const medicationList = [
    { title: "Aridol (Mannitol Inhalation Powder)" },
    { title: "Arikayace (Amakacin Liposome Inha.." },
    { title: "Arimidex (Anastrozole)" },
    { title: "Aripiprazole (Abilify)" },
    { title: "Aripiprazole" },
  ]

  const addDosage = () => {
    if (validateDosage()) {
      var dosage = { Name: dosageName, Value: dosageValue, Time: getTimeValue(dosageTime) }
      var list = dosageList
      list = list.concat(dosage)
      setDosageList(list)
      setOpenAddDosage(false)
    }
  }

  const openAddDosageDialog = () => {
    setDosageName("")
    setDosageValue("")
    setDosageTime(new Date())
    setOpenAddDosage(true)
  }
  const closeAddDosageDialog = () => {
    setOpenAddDosage(false)
  }
  return (
    <div className={classes.root}>
      <AppBar position="static" style={{ background: "#FBF1EF", boxShadow: "none" }}>
        <Toolbar className={classes.toolbardashboard}>
          <IconButton onClick={() => setOpen(true)} color="default" aria-label="Menu">
            <Icon>arrow_back</Icon>
          </IconButton>
          <Typography variant="h5">{t("Add medication")}</Typography>
        </Toolbar>
      </AppBar>
      <Box px={2}>
        <Grid container direction="row" justify="center" alignItems="flex-start">
          <Grid item lg={4} sm={10} xs={12}>
            <Box display="flex" className={classes.medicationHeader}>
              <Box flexShrink={1}>{<Icon>search</Icon>}</Box>
              <Box width="100%" pl={2}>
                <Autocomplete
                  id="free-solo-demo"
                  classes={{ popper: classes.autofillpopper, paper: classes.autofillpaper }}
                  freeSolo
                  value={medicationName}
                  onChange={(event: any, newValue: any) => {
                    setMedicationName(newValue)
                  }}
                  ref={nameInput}
                  options={medicationList.map((option) => option.title)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className={classes.autofill}
                      placeholder={t("Medication name")}
                      variant="outlined"
                    />
                  )}
                />
              </Box>
            </Box>
            <Box className={classes.textfieldwrapper}>
              <FormControl
                component="fieldset"
                classes={{
                  root: classes.textAreaControl,
                }}
              >
                <Grid item xs={12}>
                  <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="center"
                    className={classes.durationOuter}
                  >
                    {frequency.map((value) => (
                      <Grid key={value} item>
                        <ButtonBase
                          focusRipple
                          className={
                            value == selectedFrequency
                              ? classes.duration + " " + classes.durationActive
                              : classes.duration
                          }
                          onClick={() => setSelectedFrequency(value)}
                        >
                          {value}
                        </ButtonBase>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="center"
                    className={classes.weekdaysOuter}
                  >
                    {weekdays.map((value) => (
                      <Grid key={value} item>
                        <ButtonBase
                          focusRipple
                          className={
                            selectedDays.includes(value) == true
                              ? classes.weekdays + " " + classes.weekdaysActive
                              : classes.weekdays
                          }
                          onClick={() => setSelectedDaysValue(value)}
                        >
                          {value.substr(0, 1)}
                        </ButtonBase>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {dosageList.map((dosage) => (
                  <Box width={1} mb={2}>
                    <Grid container direction="row" justify="space-between" alignItems="center">
                      <Grid item xs={4}>
                        <Typography variant="body2">{dosage.Name}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" align="right">
                          {dosage.Value}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} className={classes.medicationDetails}>
                        <Typography variant="body2" align="right">
                          {dosage.Time}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Box display="flex" justifyContent="center" mb={5}>
                  <Box>
                    <ButtonBase className={classes.iconButton} onClick={() => openAddDosageDialog()}>
                      <Icon>add_circle_outline</Icon> {t("Add dosage")}
                    </ButtonBase>
                  </Box>
                </Box>

                <Box width={1} mb={5}>
                  <Grid container direction="row" justify="space-between" alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="body2">{t("Start date")}</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.medicationDetails}>
                      <Typography variant="body2" onClick={() => setStartDateOpen(true)} align="right">
                        {startDate != null ? getDateString(startDate) : getDateString(new Date())}
                      </Typography>
                      <DatePicker
                        autoOk
                        open={startDateOpen}
                        onOpen={() => setStartDateOpen(true)}
                        onClose={() => setStartDateOpen(false)}
                        value={startDate}
                        onChange={(e) => changeStartDate(e)}
                        TextFieldComponent={() => null}
                        disableToolbar={true}
                        okLabel=""
                        cancelLabel=""
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Box width={1} mb={5}>
                  <Grid container direction="row" justify="space-between" alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="body2">{t("Duration")}</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.medicationDetails}>
                      <Typography variant="body2" onClick={() => setEndDateOpen(true)} align="right">
                        {duration} {t("days")}
                      </Typography>
                      <DatePicker
                        autoOk
                        open={endDateOpen}
                        onOpen={() => setEndDateOpen(true)}
                        onClose={() => setEndDateOpen(false)}
                        value={date}
                        onChange={(e) => changeEndDate(e)}
                        TextFieldComponent={() => null}
                        disableToolbar={true}
                        okLabel=""
                        cancelLabel=""
                        minDate={startDate}
                      />
                    </Grid>
                  </Grid>
                </Box>
                {/* <Box width={1} mb={5}>
                <Grid container direction="row" justify="space-between" alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="body2">Reminders</Typography>
                  </Grid>
                  <Grid item xs={6} className={classes.medicationDetails}>
                    <InputBase
                      id="time"
                      // label="Alarm clock"
                      type="time"
                      defaultValue="07:30"
                      className={classes.reminderTime}
                      inputProps={{
                        step: 300, // 5 min
                      }}
                    />
                  </Grid>
                </Grid>
              </Box> */}
                <Box width={1} mb={5}>
                  <Grid container direction="row" justify="space-between" alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="body2"> {t("Reminders")}</Typography>
                    </Grid>
                    <Grid item xs={6} className={classes.medicationDetails}>
                      <TimePicker
                        value={reminderTime}
                        onChange={(e) => changeReminderTime(e)}
                        disableToolbar={false}
                        className={classes.reminderTime}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box textAlign="center" mt={5}>
                  <ButtonBase className={classes.btnpeach} onClick={() => saveNewMedication()}>
                    {t("Save")}
                  </ButtonBase>
                </Box>
                <Box textAlign="center" width={1} mt={3}>
                  <Link className={classes.linkpeach} onClick={props.onComplete}>
                    {t("Cancel")}
                  </Link>
                </Box>
              </FormControl>
            </Box>
            <Dialog
              open={open}
              onClose={() => setOpen(false)}
              scroll="paper"
              aria-labelledby="alert-dialog-slide-title"
              aria-describedby="alert-dialog-slide-description"
              className={classes.dialogueStyle}
            >
              <Box display="flex" justifyContent="flex-end">
                <Box>
                  <IconButton aria-label="close" className={classes.closeButton} onClick={() => setOpen(false)}>
                    <Icon>close</Icon>
                  </IconButton>
                </Box>
              </Box>

              <DialogContent className={classes.dialogueContent}>
                <Typography variant="h4">{t("Leaving so soon?")}</Typography>
                <Typography variant="body1">
                  {t("If you leave without submitting, your entry will be lost.")}
                </Typography>
              </DialogContent>
              <Grid>
                <Box textAlign="center" width={1} mt={1} mb={3}>
                  <Link
                    underline="none"
                    onClick={() => setOpen(false)}
                    className={classnames(classes.btnpeach, classes.linkButton)}
                  >
                    {t("No, don???t leave yet")}
                  </Link>
                </Box>
                <Box textAlign="center" width={1} mb={4}>
                  <Link underline="none" onClick={props.onComplete} className={classes.linkpeach}>
                    {" "}
                    {t("Yes, leave")}
                  </Link>
                </Box>
              </Grid>
            </Dialog>
            <Dialog fullWidth={true} open={openAddDosage} onClose={closeAddDosageDialog}>
              <Box display="flex" justifyContent="flex-end">
                <Box>
                  <IconButton
                    aria-label="close"
                    className={classes.closeButton}
                    onClick={() => setOpenAddDosage(false)}
                  >
                    <Icon>close</Icon>
                  </IconButton>
                </Box>
              </Box>

              <DialogContent className={classes.dialogueContent}>
                <Typography variant="h4">{t("Add Dosage")}</Typography>
                <Box mt={3} mb={4}>
                  <InputBase
                    className={classes.inputText}
                    value={dosageName}
                    placeholder="Name"
                    onChange={(e) => setDosageName(e.target.value)}
                    fullWidth={true}
                    autoFocus
                    inputRef={doseNameInput}
                    inputProps={{
                      maxLength: 30,
                    }}
                  />
                </Box>

                <Box mb={4}>
                  <InputBase
                    className={classes.inputText}
                    value={dosageValue}
                    placeholder={t("Dose")}
                    type="number"
                    onChange={(e) => setDosageValue(e.target.value)}
                    fullWidth={true}
                    inputRef={doseValueInput}
                    inputProps={{
                      maxLength: 15,
                    }}
                  />
                </Box>

                <Box>
                  <TimePicker
                    value={dosageTime}
                    onChange={(e) => changeDosageTime(e)}
                    disableToolbar={false}
                    className={classes.reminderTimepopup}
                  />
                </Box>
                <Box textAlign="center" mt={5}>
                  <ButtonBase className={classes.btnpeach} onClick={() => addDosage()}>
                    {t("Save")}
                  </ButtonBase>
                </Box>
                <Box textAlign="center" width={1} mt={3}>
                  <Link className={classes.linkpeach} onClick={closeAddDosageDialog}>
                    {t("Cancel")}
                  </Link>
                </Box>
              </DialogContent>
            </Dialog>
          </Grid>
        </Grid>
      </Box>
    </div>
  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  medicationname: {
    borderBottom: "#FFCEC2 solid 2px",
    fontSize: 30,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.75)",
  },
  dialogtitle: { padding: 0 },
  active: {
    background: "#FFAC98",
  },
  linkButton: {
    padding: "15px 25px 15px 25px",
  },

  inputText: {
    borderBottom: "#FFCEC2 solid 1px",
    fontSize: 16,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.75)",
    "& input": { textAlign: "center" },
  },
  durationOuter: { margin: "30px 0" },
  weekdaysOuter: { marginBottom: 30 },

  dialogueContent: {
    padding: "10px 20px 35px 20px",
    textAlign: "center",
    "& h4": { fontSize: 25, fontWeight: 600, marginBottom: 15 },
    "& p": { fontSize: 16, fontWeight: 600, color: "rgba(0, 0, 0, 0.75)", lineHeight: "19px" },
  },
  dialogueStyle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    color: theme.palette.grey[500],
  },

  journalStyle: {
    background: "linear-gradient(0deg, #FBF1EF, #FBF1EF)",
    borderRadius: "10px",
    padding: "0px 20px 20px 20px",
    textAlign: "justify",
    marginBottom: 20,
    "& span": {
      color: "rgba(0, 0, 0, 0.4)",
      fontSize: "12px",
      lineHeight: "40px",
    },
  },
  textAreaControl: {
    width: "100%",

    borderRadius: 10,
    // "& p": { position: "absolute", bottom: 15, right: 0 },
  },
  textArea: {
    borderRadius: "10px",
    "& fieldset": { borderWidth: 0, outline: 0 },
    "& textarea": { lineHeight: "24px" },
  },
  textfieldwrapper: {
    "& h5": { fontSize: 16, fontWeight: 600, color: "rgba(0, 0, 0, 0.4)" },
  },
  btnpeach: {
    background: "#FFAC98",
    padding: "15px 25px 15px 25px",
    borderRadius: "40px",
    minWidth: "200px",
    boxShadow: " 0px 10px 15px rgba(255, 172, 152, 0.25)",
    lineHeight: "22px",
    display: "inline-block",
    textTransform: "capitalize",
    fontSize: "16px",
    color: "rgba(0, 0, 0, 0.75)",
    fontWeight: "bold",
    "&:hover": {
      background: "#FFAC98",
      boxShadow:
        "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
    },
  },

  toolbardashboard: {
    minHeight: 65,
    padding: "0 10px",
    "& h5": {
      color: "rgba(0, 0, 0, 0.75)",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 18,
      width: "calc(100% - 96px)",
    },
  },

  linkpeach: { fontSize: 16, color: "#BC453D", fontWeight: 600 },
  weekdays: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    textAlign: "center",
    lineHeight: "32px",
    fontSize: 14,
    border: "#ccc solid 1px",
  },
  weekdaysActive: { background: "#FFCEC2", fontWeight: 600, borderColor: "#FFCEC2" },
  duration: { padding: "8px 10px", border: "1px solid #C6C6C6", borderRadius: 20, minWidth: 106, fontSize: 14 },
  durationActive: { background: "#FFCEC2", fontWeight: 600, borderColor: "#FFCEC2" },
  reminderTime: {
    float: "right",
    fontSize: 14,
    height: 28,
    overflow: "hidden",
    "& input": { textAlign: "right", fontSize: 14 },
    "& *": { border: 0 },
  },
  reminderTimepopup: {
    height: 25,
    overflow: "hidden",
    "& input": { textAlign: "center", fontSize: 16, fontWeight: 600 },
  },
  medicationHeader: {
    marginTop: 25,
    "& svg": { width: 21, height: 21 },
    "& h4": { fontSize: 18, fontWeight: 600, paddingLeft: 20 },
  },
  medicationDetails: {
    "& p": { fontWeight: 500 },
    "& input": { fontWeight: 500 },
  },
  autofill: {
    "& fieldset": { border: 0 },
    "& div": { padding: "0 !important" },
    "& input": { padding: "0 !important" },
  },
  autofillpopper: {},
  autofillpaper: { background: "rgba(245, 245, 245, 0.95);" },
  iconButton: {
    textTransform: "capitalize",
    "& svg": { color: "#E46759", marginRight: 15 },
  },
}))
