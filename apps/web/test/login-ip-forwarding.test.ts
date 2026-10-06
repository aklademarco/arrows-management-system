import { headers } from "next/headers";
import { adminLogin } from "../src/app/admin/login/actions";
import { memberLogin } from "../src/app/login/actions";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

const apiUrl = "https://acms.test/api/v1";
const clientIp = "203.0.113.42";

function loginFormData() {
  const formData = new FormData();
  formData.set("email", "member@example.com");
  formData.set("password", "valid-password");
  return formData;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  jest.mocked(headers).mockResolvedValue(
    new Headers({ "x-real-ip": clientIp }) as Awaited<
      ReturnType<typeof headers>
    >,
  );
  fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({ message: "Invalid credentials." }, 401),
  );
  jest.replaceProperty(process, "env", {
    ...process.env,
    API_URL: apiUrl,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each([
  { name: "member", login: memberLogin },
  { name: "administrator", login: adminLogin },
])("$name login", ({ login }) => {
  it("forwards the request client IP to the API login endpoint", async () => {
    await login({ message: "" }, loginFormData());

    expect(headers).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
      },
      body: JSON.stringify({
        email: "member@example.com",
        password: "valid-password",
      }),
      cache: "no-store",
    });
  });
});

