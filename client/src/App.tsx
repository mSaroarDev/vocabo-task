import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store, persistor } from "./store";
import NotionLayout from "./components/layout/notion-layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AssignedTasks from "./pages/AssignedTasks";
import Chats from "./pages/Chats";
import Tickets from "./pages/Tickets";
import StickyNotes from "./pages/StickyNotes";
import NoteEditor from "./components/sticky-notes/note-editor";
import GoogleCallback from "./pages/GoogleCallback";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <Home />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <Profile />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assigned-tasks"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <AssignedTasks />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <Chats />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <Tickets />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sticky-notes"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <StickyNotes />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sticky-notes/note/:noteId"
              element={
                <ProtectedRoute>
                  <NotionLayout>
                    <NoteEditor />
                  </NotionLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;